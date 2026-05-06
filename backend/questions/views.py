import random
from collections import defaultdict

from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import Topic, Question, PracticeSession, SingleQuestionInteraction, TopicMastery
from .serializers import (
    InteractionPayloadSerializer,
    PracticeSessionCreateSerializer,
    PracticeSessionSerializer,
    QuestionCreateSerializer,
    QuestionSerializer,
    TopicMasterySerializer,
    TopicSerializer,
)

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.annotate(question_count=Count('knowledge_points__questions'))
    serializer_class = TopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        with transaction.atomic():
            topic = serializer.save()
            # Step 7 from UC-07: Initialize Learner Mastery for all existing learners
            from users.models import Learner
            learners = Learner.objects.all()
            masteries = [
                TopicMastery(learner=l, topic=topic, status='new')
                for l in learners
            ]
            TopicMastery.objects.bulk_create(masteries, ignore_conflicts=True)

class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['knowledge_point__topic', 'tier']
    serializer_class = QuestionSerializer

class PracticeSessionViewSet(viewsets.ModelViewSet):
    queryset = PracticeSession.objects.none()
    serializer_class = PracticeSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset.none()
        return PracticeSession.objects.filter(
            learner=self.request.user.learner_profile
        ).select_related('learner__user').prefetch_related('interactions')

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    def perform_create(self, serializer):
        serializer.save(learner=self.request.user.learner_profile)

    @action(detail=False, methods=['post'], url_path='start')
    def start(self, request):
        """Create an adaptive session with up to 5 questions."""
        learner = request.user.learner_profile

        # 1. Due topics from FSRS scheduler
        selected_topics = services.get_due_topics(learner, limit=5)
        slots_needed = 5 - len(selected_topics)

        # 2. Fill remaining slots with truly new topics (no mastery entry at all)
        if slots_needed > 0:
            existing_topic_ids = TopicMastery.objects.filter(
                learner=learner,
            ).values_list('topic_id', flat=True)

            new_topics = list(
                Topic.objects.exclude(id__in=existing_topic_ids)[:slots_needed]
            )
            selected_topics.extend(new_topics)

        if not selected_topics:
            return Response(
                {"status": "caught_up", "message": "No topics available right now."},
                status=status.HTTP_200_OK,
            )

        # 3. Batch-fetch questions for all selected topics (avoids N+1)
        topic_ids = [t.id for t in selected_topics]
        all_questions = list(
            Question.objects.filter(
                knowledge_point__topic_id__in=topic_ids,
            ).select_related('knowledge_point__topic')
        )

        questions_by_topic: dict[int, list] = defaultdict(list)
        for q in all_questions:
            questions_by_topic[q.knowledge_point.topic_id].append(q)

        selected_questions = []
        for topic in selected_topics:
            candidates = questions_by_topic.get(topic.id, [])
            if candidates:
                selected_questions.append(random.choice(candidates))

        if not selected_questions:
            return Response(
                {"status": "caught_up", "message": "No topics available right now."},
                status=status.HTTP_200_OK,
            )

        # 4. Create session atomically
        with transaction.atomic():
            session = PracticeSession.objects.create(
                learner=learner,
                session_type='adaptive',
            )

        return Response({
            "session_id": session.id,
            "questions": QuestionSerializer(selected_questions, many=True).data,
        })

    @action(detail=True, methods=['patch'], url_path='finish')
    def finish(self, request, pk=None):
        """Close a session by setting its end_time."""
        session = get_object_or_404(PracticeSession, pk=pk)
        learner = request.user.learner_profile

        if session.learner != learner:
            return Response(
                {'detail': 'Session does not belong to this user.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        session.end_time = timezone.now()
        session.save()
        return Response(PracticeSessionSerializer(session).data)

class TopicMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TopicMastery.objects.none()
    serializer_class = TopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset.none()
        queryset = TopicMastery.objects.filter(learner=self.request.user.learner_profile).select_related('topic')
        due_only = self.request.query_params.get('due_only')
        if due_only == 'true':
            queryset = queryset.filter(next_review__lte=timezone.now())
        return queryset

class InteractionViewSet(viewsets.ViewSet):
    serializer_class = InteractionPayloadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = InteractionPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question_id = serializer.validated_data['question_id']
        is_correct = serializer.validated_data['is_correct']
        session_id = serializer.validated_data['session_id']

        learner = request.user.learner_profile
        question = get_object_or_404(Question, id=question_id)
        session = get_object_or_404(PracticeSession, id=session_id)

        if session.learner != learner:
            return Response(
                {'detail': 'Session does not belong to this user.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 1. Record interaction
        interaction = SingleQuestionInteraction.objects.create(
            session=session,
            question=question,
            is_correct=is_correct,
            user_response='Correct' if is_correct else 'Incorrect',
            confidence_rating=request.data.get('confidence_rating', 3 if is_correct else 1),
        )

        # 2. FSRS review
        topic = question.knowledge_point.topic
        services.process_review(learner, topic, interaction)

        # 3. Gamification
        if is_correct:
            base_xp = {1: 10, 2: 25, 3: 50}.get(question.tier, 10)
            multiplier = min(2.0, 1.0 + (learner.streak_count * 0.1))
            gained_xp = int(base_xp * multiplier)

            learner.add_xp(gained_xp)
            learner.update_streak()

            session.total_xp_earned += gained_xp
            session.save()

        return Response({'status': 'Interaction processed.'}, status=status.HTTP_201_CREATED)
