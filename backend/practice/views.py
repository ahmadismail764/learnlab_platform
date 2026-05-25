# Framework imports
from rest_framework import permissions, viewsets, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
# Our imports
from practice.models import Question, PracticeSession, QuestionResponse
from accounts.models import User
from accounts.serializers import LearnerProfileSerializer
from .serializers import (
    QuestionResponseSerializer, 
    PracticeSessionSerializer, 
    PracticeSessionCreateSerializer, 
    QuestionSerializer
)
from constants import XP_PER_CORRECT_ANSWER

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_all_questions(request):
    questions = Question.objects.prefetch_related('subtopic__topic')
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('subtopic__topic')
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]

class PracticeSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return PracticeSession.objects.none()
        if user.is_staff:
            return PracticeSession.objects.all().order_by('-start_time')
        return PracticeSession.objects.filter(learner=user).order_by('-start_time')

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    def perform_create(self, serializer):
        serializer.save(learner=self.request.user)

    @action(detail=True, methods=['post'])
    def responses(self, request, pk=None):
        session = self.get_object()
        if session.learner != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Not your session.")
            
        from .serializers import QuestionResponseCreateSerializer
        serializer = QuestionResponseCreateSerializer(data=request.data)
        if serializer.is_valid():
            response = QuestionResponse.objects.create(session=session, **serializer.validated_data)
            
            from practice.fsrs_engine import process_review
            process_review(session.learner, response.question.subtopic, response)
            
            if response.is_correct:
                session.total_xp_earned += XP_PER_CORRECT_ANSWER
                session.save()
                
            return Response(QuestionResponseSerializer(response).data, status=201)
        return Response(serializer.errors, status=400)

class LearnerProfileListView(generics.ListAPIView):
    serializer_class = LearnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_staff=False).order_by('-current_xp')

class LeaderboardView(generics.ListAPIView):
    serializer_class = LearnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.filter(is_staff=False)
        topic_id = self.request.query_params.get('topic') # type: ignore
        if topic_id:
            # Filter distinct users having mastery under this topic
            queryset = queryset.filter(masteries__subtopic__topic_id=topic_id).distinct()
        
        return queryset.order_by('-current_xp')


class GenerateAdaptiveSessionView(generics.GenericAPIView):
    """
    GET /practice/sessions/generate-adaptive/
    Returns the next recommended set of questions for the learner.
    Due/overdue FSRS items appear first; falls back to unseen questions.
    Supports optional ?topic=<uuid> filter and ?limit=<int> (default 10).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuestionSerializer

    def get(self, request):
        from django.utils import timezone as django_timezone
        from topics.models import SubtopicMastery

        limit = int(request.query_params.get('limit', 10))
        topic_id = request.query_params.get('topic')
        learner = request.user
        now = django_timezone.now()

        # Get subtopics that are due for review (next_review <= now)
        mastery_qs = SubtopicMastery.objects.filter(
            learner=learner,
            next_review__lte=now,
        )
        if topic_id:
            mastery_qs = mastery_qs.filter(subtopic__topic_id=topic_id)

        # Sort by most overdue first (lowest retrievability)
        due_subtopic_ids = list(
            mastery_qs.order_by('next_review').values_list('subtopic_id', flat=True)
        )   

        # Pull questions from due subtopics first
        due_questions_qs = Question.objects.filter(id=due_subtopic_ids)
        subtopic_order_map = {sid: idx for idx, sid in enumerate(due_subtopic_ids)}
        due_questions = sorted(
            due_questions_qs,
            key=lambda q: subtopic_order_map.get(q.id, 9999)
        )[:limit]

        # Fill remaining slots with unseen questions (no mastery record yet)
        if len(due_questions) < limit:
            seen_subtopic_ids = list(
                SubtopicMastery.objects.filter(learner=learner)
                .values_list('subtopic_id', flat=True)
            )
            unseen_qs = Question.objects.exclude(subtopic_id__in=seen_subtopic_ids)
            if topic_id:
                unseen_qs = unseen_qs.filter(subtopic__topic_id=topic_id)
            unseen_questions = list(unseen_qs[:limit - len(due_questions)])
            due_questions += unseen_questions

        # Final fallback: any questions up to limit
        if len(due_questions) < limit:
            existing_ids = [q.id for q in due_questions]
            fallback_qs = Question.objects.exclude(id__in=existing_ids)
            if topic_id:
                fallback_qs = fallback_qs.filter(subtopic__topic_id=topic_id)
            due_questions += list(fallback_qs[:limit - len(due_questions)])

        serializer = QuestionSerializer(due_questions, many=True)
        return Response({
            'questions': serializer.data,
            'message': f'Generated adaptive session with {len(due_questions)} question(s)',
        })
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return QuestionResponse.objects.all()
        return QuestionResponse.objects.filter(session__learner=user)

