from django.db import models
from django.utils import timezone
from accounts.models import Learner
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
    class TierChoices(models.IntegerChoices):
        CONCEPT = 1, 'Concept'
        APPLICATION = 2, 'Application'
        SYNTHESIS = 3, 'Synthesis'
    
    # meta information about the question
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='questions')
    tier = models.IntegerField(default=1, choices=TierChoices.choices,)
    
    # the question istelf
    text = models.TextField()
    choices = models.JSONField(default=list)
    correct_answer_index = models.IntegerField()

    def __str__(self):
        return f"[{self.subtopic.name}] T{self.tier}: {self.text[:60]}"


class PracticeSession(models.Model):
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='practice_sessions')

    # session data
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.learner} - {self.id}"


class QuestionResponse(models.Model):
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    # response data
    is_correct = models.BooleanField(default=False)
    """
    in our current implemenation of the FSRS, we are not going to use the Hard and Easy ratings,
    instead the correctness of the response is going to be mapped either to Again or to Good
    """

    def __str__(self):
        return f"{self.session.learner}'s Response to Q:{self.question.id} in Session:{self.session.id}"


class SubtopicMastery(models.Model):
    class StateChoices(models.TextChoices):
        NEW = 'NEW', 'New'
        LEARNING = 'LEARNING', 'Learning'
        REVIEW = 'REVIEW', 'Review'
        RELEARNING = 'RELEARNING', 'Relearning'
    
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='masteries')
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='masteries')

    # FSRS parameters
    difficulty = models.FloatField(default=5.0, help_text="FSRS difficulty (1–10)")
    stability = models.FloatField(default=1.0, help_text="FSRS stability in days")
    
    reps = models.IntegerField(default=0, help_text="Number of successful reviews")
    lapses = models.IntegerField(default=0, help_text="Number of times forgotten")
    
    # this is a sort of meta-data field, it might need to be calculated
    state = models.CharField(max_length=20, choices=StateChoices.choices, default='NEW')

    # scheduling data
    last_review = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('learner', 'subtopic')

    def __str__(self):
        return f"{self.learner} | {self.subtopic.name} | {self.state}"