from django.db import models
from django.conf import settings
from users.models import Learner
import uuid

class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Short summary of the topic")


class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    text = models.TextField(help_text="The question string")
    choices = models.JSONField(default=list) 
    correct_answer_index = models.IntegerField()
    
    # Adaptive Scaffolding Field
    tier = models.IntegerField(default=1, help_text="1=Concept, 2=Application, 3=Synthesis") # <--- NEW
    # explanation_video_url = models.URLField(null=True, blank=True)


class PracticeSession(models.Model):
    SESSION_TYPES = (
        ('adaptive', 'Adaptive'),
        ('quiz', 'Quiz'),
        ('review', 'Review')
    )
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='practice_sessions')
    # session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='adaptive')
    questions = models.ManyToManyField(Question, related_name='practice_sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)


class SingleQuestionInteraction(models.Model):
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='interactions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_response = models.CharField(max_length=255, null=True, blank=True)
    is_correct = models.BooleanField(default=False)

class TopicMastery(models.Model):
    STATE_CHOICES = (
        ('new', 'New'),
        ('learning', 'Learning'),
        ('review', 'Review'),
        ('relearning', 'Relearning'),
    )
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='masteries')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    difficulty = models.FloatField(default=5.0, help_text="FSRS difficulty parameter (1-10)")
    stability = models.FloatField(default=1.0, help_text="FSRS stability in days")
    
    reps = models.IntegerField(default=0, help_text="Number of successful reviews")
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='new')

    last_review = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('learner', 'topic')

# class Notification(models.Model):
#     learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='notifications')
#     topics = models.ManyToManyField(Topic)
#     sent_at = models.DateTimeField(auto_now_add=True)
#     responded_at = models.DateTimeField(null=True, blank=True)