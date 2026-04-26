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

    @action(detail=False, methods=['get'], url_path='generate-adaptive')
    def generate_adaptive(self, request):
        import random
        from .models import Topic

        learner = request.user.learner_profile
        now = timezone.now()

        # 1. Get due topics using FIRe service
        selected_topics = services.get_due_topics(learner, limit=5)
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

        # 3. Pick 1 random question for each selected topic (batch fetch to avoid N+1)
        selected_questions = []
        if selected_topics:
            from django.db.models import Q as DjangoQ
            topic_ids = [t.id for t in selected_topics]
            all_questions = list(
                Question.objects.filter(
                    knowledge_point__topic_id__in=topic_ids
                ).select_related('knowledge_point__topic')
            )
            # Group by topic
            questions_by_topic = {}
            for q in all_questions:
                tid = q.knowledge_point.topic_id
                questions_by_topic.setdefault(tid, []).append(q)
            
            for topic in selected_topics:
                topic_qs = questions_by_topic.get(topic.id, [])
                if topic_qs:
                    selected_questions.append(random.choice(topic_qs))

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
            queryset = queryset.filter(next_due__lte=timezone.now())
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
                
            # 1. Record interaction manually so calculate_net_work can find it
            interaction = SingleQuestionInteraction.objects.create(
                session=session,
                question=question,
                is_correct=is_correct,
                user_response="Correct" if is_correct else "Incorrect",
                confidence_rating=3 if is_correct else 1
            )
            
            # 2. Calculate net work
            topic = question.knowledge_point.topic
            net_work = services.calculate_net_work(session, topic)
            
            # 3. Process review
            services.process_review(learner, topic, net_work)
            
            # 4. Gamification
            if is_correct:
                base_xp = {1: 10, 2: 25, 3: 50}.get(question.tier, 10)
                multiplier = min(2.0, 1.0 + (learner.streak_count * 0.1))
                gained_xp = int(base_xp * multiplier)
                
                learner.add_xp(gained_xp)
                learner.update_streak()
                
                session.total_xp_earned += gained_xp
                session.save()
            else:
                learner.save()
            
            return Response({'status': 'Interaction processed.'}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
