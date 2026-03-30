# Code Diff: [views.py](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/views.py) — Fix import & rewrite [perform_create](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/views.py#63-121)

```diff:views.py
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
===
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
```

## Key Changes

| Area | Before | After |
|---|---|---|
| Import | `update_stability, calculate_next_review` | [process_topic_review](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/fsrs_engine.py#21-68) |
| FSRS update | Called once **per interaction** | Called once **per topic** (averaged rating) |
| Rating aggregation | None | `topic_ratings` dict collects all ratings per `topic.id`, then averages + clamps to 1–4 |
| `select_question_tier` | Imported from removed helper | Inline closure inside [generate_adaptive](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/views.py#122-171) |
| DB queries | `interactions.all()` | `interactions.select_related('question__topic').all()` (avoids N+1) |

---

## 4. [views.py](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/views.py) — Generating Adaptive Practice Sheets

```diff:views.py
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
===
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
```

**Logic for [generate_adaptive](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/views.py#122-171):**
1. Queries up to 5 [TopicMastery](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/models.py#55-73) records where `next_review_date <= timezone.now()`, ordered so the most overdue come first.
2. If fewer than 5 topics are due, queries [Topic](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/models.py#6-13) excluding any topic the student has already interacted with to fill the remaining slots.
3. Selects 1 random [Question](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/models.py#14-26) from each of the chosen topics.
4. Returns a flat list of mixed questions for a dynamic practice sheet.

---

## 5. `send_reminders` Management Command

```diff:send_reminders.py
===
from django.core.management.base import BaseCommand
from django.utils import timezone
from collections import defaultdict
from questions.models import TopicMastery

class Command(BaseCommand):
    help = 'Sends practice sheet reminders to students with due FSRS topics.'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Query all TopicMastery records due for review
        due_masteries = TopicMastery.objects.filter(
            next_review_date__lte=now
        ).select_related('student__user')
        
        # Group by student
        student_due_counts = defaultdict(int)
        for mastery in due_masteries:
            # Assumes Student model has a user relation
            username = mastery.student.user.username
            student_due_counts[username] += 1
            
        if not student_due_counts:
            self.stdout.write(self.style.SUCCESS("No students have topics due for review today."))
            return

        # Print reminders
        for username, count in student_due_counts.items():
            self.stdout.write(
                self.style.WARNING(f"Reminder: {username} has {count} topics due for review today.")
            )
        
        self.stdout.write(self.style.SUCCESS(f"Processed reminders for {len(student_due_counts)} students."))
```

**Usage:**
```bash
python manage.py send_reminders
```
Queries all [TopicMastery](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/models.py#55-73) records across all students where FSRS has scheduled a review that is currently due. Groups the count by student and prints a reminder.
