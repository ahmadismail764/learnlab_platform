import random
import uuid
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
from .models import Topic, Subtopic, Question, PracticeSession, QuestionResponse, SubtopicMastery
from .serializers import (
    InteractionPayloadSerializer,
    PracticeSessionCreateSerializer,
    PracticeSessionSerializer,
    QuestionCreateSerializer,
    QuestionSerializer,
    SubtopicMasterySerializer,
    SubtopicSerializer,
    TopicSerializer,
)

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAdminOrReadOnly]

class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.annotate(question_count=Count('questions'))
    serializer_class = SubtopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        with transaction.atomic():
            subtopic = serializer.save()
            from users.models import Learner
            learners = Learner.objects.all()
            masteries = [
                SubtopicMastery(learner=l, subtopic=subtopic, state='NEW')
                for l in learners
            ]
            SubtopicMastery.objects.bulk_create(masteries, ignore_conflicts=True)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subtopic', 'tier']
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
        ).select_related('learner__user').prefetch_related('responses')

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

        # 1. Due subtopics from FSRS scheduler
        selected_subtopics = services.get_due_topics(learner, limit=5)
        slots_needed = 5 - len(selected_subtopics)

        # 2. Fill remaining slots with new subtopics
        if slots_needed > 0:
            existing_subtopic_ids = SubtopicMastery.objects.filter(
                learner=learner,
            ).values_list('subtopic_id', flat=True)

            new_subtopics = list(
                Subtopic.objects.exclude(id__in=existing_subtopic_ids)[:slots_needed]
            )
            selected_subtopics.extend(new_subtopics)

        if not selected_subtopics:
            return Response(
                {"status": "caught_up", "message": "No practice needed right now."},
                status=status.HTTP_200_OK,
            )

        # 3. Batch-fetch questions
        subtopic_ids = [s.id for s in selected_subtopics]
        all_questions = list(
            Question.objects.filter(
                subtopic_id__in=subtopic_ids,
            ).select_related('subtopic')
        )

        questions_by_subtopic: dict[uuid.UUID, list] = defaultdict(list)
        for q in all_questions:
            questions_by_subtopic[q.subtopic_id].append(q)

        selected_questions = []
        for st in selected_subtopics:
            candidates = questions_by_subtopic.get(st.id, [])
            if candidates:
                selected_questions.append(random.choice(candidates))

        if not selected_questions:
            return Response(
                {"status": "caught_up", "message": "No questions available for selected topics."},
                status=status.HTTP_200_OK,
            )

        # 4. Create session
        with transaction.atomic():
            session = PracticeSession.objects.create(
                learner=learner,
            )

        return Response({
            "session_id": session.id,
            "questions": QuestionSerializer(selected_questions, many=True).data,
        })

    @action(detail=True, methods=['patch'], url_path='finish')
    def finish(self, request, pk=None):
        """Close a session."""
        session = get_object_or_404(PracticeSession, pk=pk)
        learner = request.user.learner_profile

        if session.learner != learner:
            return Response(
                {'detail': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        session.end_time = timezone.now()
        session.save()
        return Response(PracticeSessionSerializer(session).data)

class SubtopicMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubtopicMastery.objects.none()
    serializer_class = SubtopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset.none()
        queryset = SubtopicMastery.objects.filter(learner=self.request.user.learner_profile).select_related('subtopic')
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
        confidence = serializer.validated_data.get('confidence_rating', 3)
        time_taken = serializer.validated_data.get('time_taken_seconds', 0.0)

        learner = request.user.learner_profile
        question = get_object_or_404(Question, id=question_id)
        session = get_object_or_404(PracticeSession, id=session_id)

        if session.learner != learner:
            return Response(
                {'detail': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 1. Record response
        response_obj = QuestionResponse.objects.create(
            session=session,
            question=question,
            is_correct=is_correct,
            confidence_rating=confidence,
            time_taken_seconds=time_taken,
        )

        # 2. FSRS review
        subtopic = question.subtopic
        services.process_review(learner, subtopic, response_obj)

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
