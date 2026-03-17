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
from .fsrs_engine import update_stability, calculate_next_review
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from datetime import datetime

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.annotate(question_count=Count('questions'))
    serializer_class = TopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        with transaction.atomic():
            topic = serializer.save()
            # Step 7 from UC-07: Initialize Student Mastery for all existing students
            from users.models import Student
            students = Student.objects.all()
            masteries = [
                TopicMastery(student=s, topic=topic, stability=0, difficulty=5.0)
                for s in students
            ]
            TopicMastery.objects.bulk_create(masteries, ignore_conflicts=True)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['topic', 'tier']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        return QuestionSerializer

class PracticeSessionViewSet(viewsets.ModelViewSet):
    serializer_class = PracticeSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PracticeSession.objects.filter(student=self.request.user.student_profile)

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        # This standard perform_create handles saving the session results (end_time, XP, etc.)
        session = serializer.save(student=self.request.user.student_profile, end_time=timezone.now())
        student = session.student
        total_xp_gained = 0

        for interaction in session.interactions.all():
            question = interaction.question
            topic = question.topic

            try:
                selected_index = int(interaction.user_response)
            except (ValueError, TypeError):
                selected_index = -1
            
            interaction.is_correct = (selected_index == question.correct_answer_index)
            interaction.save()

            if not interaction.is_correct:
                rating = 1 # Again
                student.streak_count = 0 
            else:
                if interaction.confidence_rating >= 4:
                    rating = 4 # Easy
                elif interaction.confidence_rating >= 3:
                    rating = 3 # Good
                else:
                    rating = 2 # Hard

                base_xp = {1: 10, 2: 25, 3: 50}.get(question.tier, 10)
                multiplier = min(2.0, 1.0 + (student.streak_count * 0.1))
                xp = int(base_xp * multiplier)
                total_xp_gained += xp
                student.streak_count += 1

            mastery, created = TopicMastery.objects.get_or_create(
                student=student,
                topic=topic
            )

            new_stability, new_difficulty = update_stability(
                current_stability=mastery.stability,
                current_difficulty=mastery.difficulty,
                last_review=mastery.last_review_date,
                rating_val=rating
            )

            mastery.stability = new_stability
            mastery.difficulty = new_difficulty
            
            next_interval = calculate_next_review(new_stability)
            mastery.next_review_date = timezone.now() + next_interval
            mastery.save() 

        session.total_xp_earned = total_xp_gained
        session.save()
        
        student.total_xp += total_xp_gained
        student.last_practice_date = timezone.now().date()
        student.save()

    @action(detail=False, methods=['get'], url_path='generate-adaptive')
    def generate_adaptive(self, request):
        student = request.user.student_profile
        from .fsrs_engine import select_question_tier
        import random

        # 1. Identify due topic masteries
        due_masteries = TopicMastery.objects.filter(student=student, next_review_date__lte=timezone.now())

        if not due_masteries.exists():
            return Response({"status": "All caught up", "message": "No topics are due for review!"})

        # 2. Pick a random due mastery to focus on, or a mix
        mastery = random.choice(due_masteries)
        tier = select_question_tier(mastery.stability)

        # 3. Fetch questions for this topic and tier
        questions = Question.objects.filter(topic=mastery.topic, tier=tier)
        
        if not questions.exists():
            # Fallback to any question for this topic
            questions = Question.objects.filter(topic=mastery.topic)

        # 4. Return serialized questions (limit to e.g. 5 for a quick adaptive set)
        limit = min(questions.count(), 5)
        selected_questions = random.sample(list(questions), limit)
        
        from .serializers import QuestionSerializer
        serializer = QuestionSerializer(selected_questions, many=True)
        return Response({
            "topic": mastery.topic.name,
            "topic_id": mastery.topic.id,
            "tier": tier,
            "questions": serializer.data
        })

class TopicMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = TopicMastery.objects.filter(student=self.request.user.student_profile).select_related('topic')
        due_only = self.request.query_params.get('due_only')
        if due_only == 'true':
            queryset = queryset.filter(next_review_date__lte=timezone.now())
        return queryset
