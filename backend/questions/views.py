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
        session = serializer.save(student=self.request.user.student_profile, end_time=timezone.now())
        student = session.student
        total_xp_gained = 0

        # --- Pass 1: grade every interaction, accumulate per-topic ratings ---
        # topic_id -> list of integer ratings (1-4)
        topic_ratings: dict[int, list[int]] = {}

        for interaction in session.interactions.select_related('question__topic').all():
            question = interaction.question
            topic = question.topic

            try:
                selected_index = int(interaction.user_response)
            except (ValueError, TypeError):
                selected_index = -1

            interaction.is_correct = (selected_index == question.correct_answer_index)
            interaction.save()

            if not interaction.is_correct:
                rating = 1  # Again
                student.streak_count = 0
            else:
                if interaction.confidence_rating >= 4:
                    rating = 4  # Easy
                elif interaction.confidence_rating >= 3:
                    rating = 3  # Good
                else:
                    rating = 2  # Hard

                base_xp = {1: 10, 2: 25, 3: 50}.get(question.tier, 10)
                multiplier = min(2.0, 1.0 + (student.streak_count * 0.1))
                total_xp_gained += int(base_xp * multiplier)
                student.streak_count += 1

            topic_ratings.setdefault(topic.id, []).append(rating)

        # --- Pass 2: run FSRS once per topic using the averaged rating ---
        from .models import Topic as TopicModel
        for topic_id, ratings in topic_ratings.items():
            topic = TopicModel.objects.get(pk=topic_id)
            mastery, _ = TopicMastery.objects.get_or_create(student=student, topic=topic)

            # Round to nearest valid rating (1-4)
            avg_rating = round(sum(ratings) / len(ratings))
            avg_rating = max(1, min(4, avg_rating))

            process_topic_review(mastery, avg_rating)

        session.total_xp_earned = total_xp_gained
        session.save()

        student.total_xp += total_xp_gained
        student.last_practice_date = timezone.now().date()
        student.save()

    @action(detail=False, methods=['get'], url_path='generate-adaptive')
    def generate_adaptive(self, request):
        import random
        from .models import Topic

        student = request.user.student_profile
        now = timezone.now()

        # 1. Identify due topic masteries (max 5)
        due_masteries = list(TopicMastery.objects.filter(
            student=student, 
            next_review_date__lte=now
        ).select_related('topic').order_by('next_review_date')[:5])

        selected_topics = [m.topic for m in due_masteries]
        slots_needed = 5 - len(selected_topics)

        # 2. Fill remaining slots with un-interacted topics
        if slots_needed > 0:
            interacted_topic_ids = TopicMastery.objects.filter(
                student=student
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
            topic_questions = list(Question.objects.filter(topic=topic))
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
    serializer_class = TopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = TopicMastery.objects.filter(student=self.request.user.student_profile).select_related('topic')
        due_only = self.request.query_params.get('due_only')
        if due_only == 'true':
            queryset = queryset.filter(next_review_date__lte=timezone.now())
        return queryset
