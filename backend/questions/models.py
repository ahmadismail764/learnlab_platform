from django.db import models
from django.utils import timezone
from users.models import Learner
import uuid


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Subtopic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='subtopics')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.topic.name} → {self.name}"


class Question(models.Model):
    TIER_CHOICES = [
        (1, 'Concept'),
        (2, 'Application'),
        (3, 'Synthesis'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    choices = models.JSONField(default=list)
    correct_answer_index = models.IntegerField()
    tier = models.IntegerField(default=1, choices=TIER_CHOICES, help_text="1=Concept, 2=Application, 3=Synthesis")

    def __str__(self):
        return f"[{self.subtopic.name}] T{self.tier}: {self.text[:60]}"


class PracticeSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='practice_sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)

    def __str__(self):
        return f"Session {self.id} — {self.learner}"


class QuestionResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    is_correct = models.BooleanField(default=False)
    confidence_rating = models.IntegerField(
        default=3,
        help_text="1=Total guess, 5=Completely sure"
    )
    time_taken_seconds = models.FloatField(default=0.0)

    def __str__(self):
        return f"Response to Q:{self.question.id} in Session:{self.session.id}"


class SubtopicMastery(models.Model):
    STATE_CHOICES = [
        ('NEW', 'New'),
        ('LEARNING', 'Learning'),
        ('REVIEW', 'Review'),
        ('RELEARNING', 'Relearning'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='masteries')
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='masteries')

    difficulty = models.FloatField(default=5.0, help_text="FSRS difficulty (1–10)")
    stability = models.FloatField(default=1.0, help_text="FSRS stability in days")
    reps = models.IntegerField(default=0, help_text="Number of successful reviews")
    lapses = models.IntegerField(default=0, help_text="Number of times forgotten")
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='NEW')

    last_review = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('learner', 'subtopic')

    def __str__(self):
        return f"{self.learner} | {self.subtopic.name} | {self.state}"