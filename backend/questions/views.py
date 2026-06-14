from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Topic, Question, PracticeSession, SingleQuestionInteraction, TopicMastery
from .serializers import (
    TopicSerializer, QuestionSerializer, QuestionCreateSerializer,
    PracticeSessionSerializer, PracticeSessionCreateSerializer,
    TopicMasterySerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from .fsrs_engine import process_topic_review
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from datetime import datetime
from django.shortcuts import get_object_or_404
from . import services
from .serializers import InteractionPayloadSerializer

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
                TopicMastery(learner=l, topic=topic, stability=0, difficulty=5.0)
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
        return PracticeSession.objects.filter(learner=self.request.user.learner_profile)

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    def perform_create(self, serializer):
        session = serializer.save(learner=self.request.user.learner_profile, end_time=timezone.now())

    @action(detail=False, methods=['get'], url_path='generate-adaptive')
    def generate_adaptive(self, request):
        import random
        from .models import Topic

        learner = request.user.learner_profile
        now = timezone.now()

        # 1. Identify due topic masteries (max 5)
        due_masteries = list(TopicMastery.objects.filter(
            learner=learner, 
            next_review_date__lte=now
        ).select_related('topic').order_by('next_review_date')[:5])

        selected_topics = [m.topic for m in due_masteries]
        slots_needed = 5 - len(selected_topics)

        # 2. Fill remaining slots with un-interacted topics
        if slots_needed > 0:
            interacted_topic_ids = TopicMastery.objects.filter(
                learner=learner
            ).values_list('topic_id', flat=True)

            new_topics = list(Topic.objects.exclude(
                id__in=interacted_topic_ids
            )[:slots_needed])

            selected_topics.extend(new_topics)

        if not selected_topics:
            return Response({"status": "All caught up", "message": "No topics available!"})

        # 3. Pick 1 random question for each selected topic
        selected_questions = []
        for topic in selected_topics:
            # We don't bother with 'tier' mapping here for a general practice sheet, 
            # just grab any question from the topic.
            topic_questions = list(Question.objects.filter(knowledge_point__topic=topic))
            if topic_questions:
                selected_questions.append(random.choice(topic_questions))

        # 4. Return serialized questions
        from .serializers import QuestionSerializer
        serializer = QuestionSerializer(selected_questions, many=True)
        return Response({
            "status": "success",
            "sheet_size": len(selected_questions),
            "questions": serializer.data
        })

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
            queryset = queryset.filter(next_review_date__lte=timezone.now())
        return queryset

class InteractionViewSet(viewsets.ViewSet):
    serializer_class = InteractionPayloadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = InteractionPayloadSerializer(data=request.data)
        if serializer.is_valid():
            question_id = serializer.validated_data['question_id']
            is_correct = serializer.validated_data['is_correct']
            session_id = serializer.validated_data['session_id']
            
            learner = request.user.learner_profile
            question = get_object_or_404(Question, id=question_id)
            session = get_object_or_404(PracticeSession, id=session_id)
            
            if session.learner != learner:
                return Response({'detail': 'Session does not belong to this user.'}, status=status.HTTP_403_FORBIDDEN)
                
            services.process_interaction(learner, question, is_correct, session)
            
            return Response({'status': 'Interaction processed.'}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
