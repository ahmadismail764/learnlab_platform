# Core imports
from django.utils import timezone as django_timezone

# Framework imports
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer, OpenApiParameter, OpenApiTypes
from rest_framework import viewsets, generics, serializers, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

# Our imports
from accounts.models import User
from topics.models import Subtopic, SubtopicMastery
from practice.fsrs_engine import process_review
from practice.serializers import (
    QuestionAdminSerializer,
    QuestionCreateAndUpdateSerializer,
    QuestionSerializer,
    QuestionResponseCreateSerializer,
    QuestionResponseSerializer,
    PracticeSessionSerializer,
    PracticeSessionCreateSerializer,
    LeaderboardSerializer,
)
from practice.models import Question, PracticeSession, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER


class QuestionViewSet(viewsets.ModelViewSet):
    # Optimized Join handling syntax
    queryset = Question.objects.select_related('subtopic__topic').all()
    
    def get_permissions(self):
        """
        Explicitly assign permissions based on the active ViewSet action lifecycle.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Dynamically route serializers to isolate sensitive data fields.
        Staff reads get correct_answer_index; learner reads never do.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateAndUpdateSerializer
        if self.request and self.request.user and self.request.user.is_staff:
            return QuestionAdminSerializer
        return QuestionSerializer


@extend_schema_view(
    list=extend_schema(operation_id='practice_sessions_list'),
    retrieve=extend_schema(
        operation_id='practice_sessions_retrieve',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
    ),
    create=extend_schema(operation_id='practice_sessions_create'),
    update=extend_schema(
        operation_id='practice_sessions_update',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
    ),
    partial_update=extend_schema(
        operation_id='practice_sessions_partial_update',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
    ),
    destroy=extend_schema(
        operation_id='practice_sessions_destroy',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
    ),
)
class PracticeSessionViewSet(viewsets.ModelViewSet):

    def get_permissions(self):
        """
        FIXED: Correctly returns instantiated permission arrays to prevent runtime crashes.
        """
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Dynamic Query Isolation:
        - Staff/Admins can see the global history of all student practice logs.
        - Learners are strictly locked down to viewing only their own rows.
        """
        user = self.request.user
        if user.is_staff:
            return PracticeSession.objects.all().order_by('-start_time')
        return PracticeSession.objects.filter(learner=user).order_by('-start_time')

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new practice session for the authenticated learner.
        """
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)

        session = create_serializer.save(learner=request.user)

        response_serializer = PracticeSessionSerializer(
            session,
            context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Practice history records are immutable and cannot be deleted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @extend_schema(
        request=QuestionResponseCreateSerializer,
        responses={201: QuestionResponseSerializer},
        description="Submit a single question response within an active practice session. Triggers FSRS review processing and updates session XP.",
    )
    @action(detail=True, methods=['post'])
    def responses(self, request, pk=None):
        session = self.get_object()
        if session.learner != request.user:
            raise PermissionDenied("You do not have permission to append data to this session.")
        
        serializer = QuestionResponseCreateSerializer(data=request.data)

        if serializer.is_valid():
            validated = serializer.validated_data
            question = validated['question']
            selected = validated['selected_answer_index']

            is_correct = (selected == question.correct_answer_index)

            response = QuestionResponse.objects.create(
                session=session,
                is_correct=is_correct,
                **validated
            )

            process_review(session.learner, response.question.subtopic, response)

            if response.is_correct:
                session.total_xp_earned += XP_PER_CORRECT_ANSWER
                session.save()

            return Response(QuestionResponseSerializer(response).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenerateAdaptiveSessionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionSerializer

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        topic_id = request.query_params.get('topic')
        learner = request.user
        now = django_timezone.now()

        # ------------------------------------------------------------
        # Due reviews (True Randomized Selection across due subtopics)
        # ------------------------------------------------------------
        due_shuffled_qs = Question.objects.filter(
            subtopic__masteries__learner=learner,
            subtopic__masteries__next_review__lte=now
        ).order_by('?')

        if topic_id:
            due_shuffled_qs = due_shuffled_qs.filter(subtopic__topic_id=topic_id)

        session_questions = list(due_shuffled_qs[:limit])

        # ------------------------------------------------------------
        # FIXED: Clean Fallback block ensures new users aren't left with an empty screen
        # ------------------------------------------------------------
        if not session_questions:
            fallback_qs = Question.objects.order_by('?')
            if topic_id:
                fallback_qs = fallback_qs.filter(subtopic__topic_id=topic_id)
            session_questions = list(fallback_qs[:limit])

        # ------------------------------------------------------------
        # Serialization Response Return
        # ------------------------------------------------------------
        serializer = self.get_serializer(session_questions, many=True)
        return Response({
            'questions': serializer.data,
            'message': f'Generated adaptive session with {len(session_questions)} question(s)',
        }, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(
        operation_id='practice_leaderboard_list',
        description="Returns all learners ranked by XP descending. Staff accounts are excluded. Filter by ?topic=<uuid> to rank only learners active in that topic.",
        parameters=[
            OpenApiParameter(name='topic', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False),
        ],
        responses={200: LeaderboardSerializer(many=True)},
    )
)
class LeaderboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        topic_id = self.request.query_params.get('topic')
        qs = User.objects.filter(is_staff=False).order_by('-current_xp')
        if topic_id:
            from topics.models import SubtopicMastery
            learner_ids = SubtopicMastery.objects.filter(
                subtopic__topic_id=topic_id
            ).values_list('learner_id', flat=True).distinct()
            qs = qs.filter(id__in=learner_ids)
        return qs