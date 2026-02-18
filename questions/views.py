from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Topic, Question, PracticeSheet, Submission, TopicMastery
from .serializers import (
    TopicSerializer, QuestionSerializer, QuestionCreateSerializer,
    PracticeSheetSerializer, SubmissionSerializer, SubmissionCreateSerializer,
    TopicMasterySerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from .fsrs_engine import update_stability, calculate_next_review
from django.db import transaction
from django.db.models import Count

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.annotate(question_count=Count('questions'))
    serializer_class = TopicSerializer
    permission_classes = [IsAdminOrReadOnly]

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['topic', 'tier']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        return QuestionSerializer

class PracticeSheetViewSet(viewsets.ModelViewSet):
    # Only list, retrieve, create
    http_method_names = ['get', 'post', 'head', 'options']
    serializer_class = PracticeSheetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return all sheets for now, or filter by user?
        # The model doesn't link sheet to user directly, only submission links student to sheet.
        # But maybe we want to return sheets that the student has submitted?
        # Or just all sheets available (which are generated dynamically?)
        # If sheets are generated per user, we should probably associate them with the user.
        # But PracticeSheet model doesn't have a user field.
        # Maybe sheets are ephemeral or shared?
        # "PracticeSheet (M2M to Question, total_xp)"
        # If I create a sheet for a user, it's stored in DB.
        return PracticeSheet.objects.all()

    def create(self, request, *args, **kwargs):
        # Auto-generate a sheet
        # This logic should be implemented here or in a service.
        # For now, I'll select 5 random questions.
        # Ideally, use TopicMastery to select appropriate questions.

        # Simple implementation for now:
        import random
        questions = list(Question.objects.all())
        if len(questions) > 5:
            selected_questions = random.sample(questions, 5)
        else:
            selected_questions = questions

        sheet = PracticeSheet.objects.create(total_xp=0) # XP calculated later?
        sheet.questions.set(selected_questions)

        # Calculate total XP based on tiers
        total_xp = sum([q.tier * 10 for q in selected_questions]) # Simplified XP calculation
        sheet.total_xp = total_xp
        sheet.save()

        serializer = self.get_serializer(sheet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Submission.objects.filter(student=self.request.user.student_profile)

    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissionCreateSerializer
        return SubmissionSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            # Save submission first
            submission = serializer.save(student=self.request.user.student_profile)
            student = submission.student

            total_xp_gained = 0

            for answer in submission.answers.all():
                question = answer.question
                topic = question.topic

                # Determine Correctness & Rating
                is_correct = (answer.selected_answer_index == question.correct_answer_index)

                if not is_correct:
                    rating = 1 # Again
                    student.streak_count = 0 # Reset streak
                else:
                    # Map confidence to rating
                    # 1=Again, 2=Hard, 3=Good, 4=Easy
                    if answer.confidence >= 0.8:
                        rating = 4 # Easy
                    elif answer.confidence >= 0.5:
                        rating = 3 # Good
                    else:
                        rating = 2 # Hard

                    # Calculate XP
                    base_xp = {1: 10, 2: 25, 3: 50}.get(question.tier, 10)

                    # Apply Streak Multiplier
                    # Multiplier = 1.0 + (streak * 0.1), capped at 2.0
                    multiplier = min(2.0, 1.0 + (student.streak_count * 0.1))
                    xp = int(base_xp * multiplier)
                    total_xp_gained += xp

                    student.streak_count += 1

                # Update Topic Mastery (FSRS)
                mastery, created = TopicMastery.objects.get_or_create(
                    student=student,
                    topic=topic
                )

                # If created, defaults are diff=0, stab=0.
                # last_review_date is auto_now, so it's set to now on creation.
                # But for FSRS calculation, we need previous review.
                # If created, previous review doesn't exist.
                # update_stability handles new card logic.

                new_stability, new_difficulty = update_stability(
                    current_stability=mastery.stability,
                    current_difficulty=mastery.difficulty,
                    last_review=mastery.last_review_date,
                    rating_val=rating
                )

                mastery.stability = new_stability
                mastery.difficulty = new_difficulty
                mastery.save() # Updates last_review_date to now

            # Update Student XP
            student.xp += total_xp_gained
            student.save()

class TopicMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TopicMastery.objects.filter(student=self.request.user.student_profile).select_related('topic')
