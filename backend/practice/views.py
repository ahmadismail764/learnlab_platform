# Core django imports
from django.utils import timezone as django_timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.db import transaction
# DRF imports
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer, OpenApiParameter, OpenApiTypes
from rest_framework import viewsets, generics, serializers, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
# Our imports
from learnlab_platform.renderers import IndentedJSONRenderer
from practice.fsrs_engine import process_review
from practice.serializers import (
    QuestionAdminSerializer,
    QuestionCreateAndUpdateSerializer,
    QuestionSerializer,
    QuestionResponseFeedbackSerializer,
    QuestionResponseRatingSerializer,
    AnswerSubmitSerializer,
    PracticeSessionSerializer,
    PracticeSessionCreateSerializer,
)
from django.shortcuts import get_object_or_404
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
    #######################################
    # Management functions
    #######################################
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
        Create a session and immediately seed it with empty response placeholders.
        """
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)

        limit = int(request.query_params.get('limit', 10))
        topic_id = request.query_params.get('topic')
        learner = request.user
        now = django_timezone.now()

        # Gather adaptive or fallback questions
        due_shuffled_qs = Question.objects.filter(
            subtopic__masteries__learner=learner,
            subtopic__masteries__next_review__lte=now
        ).order_by('?')
        if topic_id:
            due_shuffled_qs = due_shuffled_qs.filter(subtopic__topic_id=topic_id)
        session_questions = list(due_shuffled_qs[:limit])

        if not session_questions:
            fallback_qs = Question.objects.order_by('?')
            if topic_id:
                fallback_qs = fallback_qs.filter(subtopic__topic_id=topic_id)
            session_questions = list(fallback_qs[:limit])

        # Use a transaction to ensure both session and placeholders are created safely together
        with transaction.atomic():
            session = create_serializer.save(learner=learner)
            
            # Seed the database with empty placeholder responses linked to each question
            placeholders = [
                QuestionResponse(
                    session=session,
                    question=question,
                    selected_answer_index=None,  # Unanswered
                    is_correct=False             # Default fallback
                )
                for question in session_questions
            ]
            QuestionResponse.objects.bulk_create(placeholders)

        # Serialize everything together
        session_serializer = PracticeSessionSerializer(session, context={'request': request})
        
        # Note: You should ensure your PracticeSessionSerializer includes or nests 
        # its related responses so the frontend guy instantly gets the placeholder IDs!
        response_data = session_serializer.data
        response_data['message'] = f'Generated adaptive session with {len(session_questions)} placeholders.'

        return Response(response_data, status=status.HTTP_201_CREATED)

    @extend_schema(
        operation_id='practice_sessions_patch_response',
        request=AnswerSubmitSerializer,
        responses={
            200: QuestionResponseFeedbackSerializer,
            400: inline_serializer('AlreadyAnsweredError', fields={'detail': serializers.CharField()}),
        },
        parameters=[
            OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, description='Practice session UUID'),
            OpenApiParameter('question_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, description='Question UUID to answer'),
        ],
        description=(
            "Submit an answer for one question in an active practice session. "
            "The session must have been created via POST /sessions/ which seeds placeholder responses. "
            "Returns the full feedback including correct_answer_index for post-submit reveal. "
            "Re-submitting an already-answered question returns 400."
        ),
    )
    @action(detail=True, methods=['patch'], url_path=r'responses/(?P<question_id>[^/.]+)')
    def submit_placeholder_response(self, request, pk=None, question_id=None):
        session = self.get_object()
        if session.learner != request.user:
            raise PermissionDenied("You do not have permission to modify this session.")

        response = get_object_or_404(QuestionResponse, session=session, question_id=question_id)

        if response.selected_answer_index is not None:
            return Response({"detail": "This question has already been answered."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        selected = serializer.validated_data['selected_answer_index']
        question = response.question
        is_correct = (selected == question.correct_answer_index)

        response.selected_answer_index = selected
        response.is_correct = is_correct
        response.save()

        process_review(session.learner, question.subtopic, response)

        if is_correct:
            session.total_xp_earned += XP_PER_CORRECT_ANSWER
            session.save()

        return Response(QuestionResponseFeedbackSerializer(response).data, status=status.HTTP_200_OK)

# class QuestionResponseViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     Read-only viewset for question responses.
#     Staff see all; learners see only their own session responses.
#     """
#     permission_classes = [IsAuthenticated]
#     serializer_class = QuestionResponseFeedbackSerializer

#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff:
#             return QuestionResponse.objects.select_related('question').all()
#         return QuestionResponse.objects.select_related('question').filter(session__learner=user)
