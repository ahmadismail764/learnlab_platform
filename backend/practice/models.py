import uuid
# Core django imports
from django.db import models
from django.conf import settings
# Our imports
from accounts.models import User
from topics.models import Subtopic
from practice.constants import TIER_CHOICES

class Question(models.Model):
    # meta information about the question
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subtopic = models.ForeignKey(Subtopic, on_delete=models.SET_NULL, null=True, related_name='questions')
    tier = models.IntegerField(default=TIER_CHOICES[0][0], choices=TIER_CHOICES)
    
    # the question itself
    text = models.TextField()
    choices = models.JSONField(default=list)
    correct_answer_index = models.IntegerField()

    def __str__(self):
        return f"[{self.subtopic.name}] T{self.tier}: {self.text[:60]}"


class PracticeSession(models.Model):
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='practice_sessions')

    # session data
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.learner} - {self.id}"


class QuestionResponse(models.Model):
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(PracticeSession, on_delete=models.SET_NULL, null=True, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True)

    # server-side computed
    is_correct = models.BooleanField(default=False)

    # data coming from the response
    selected_answer_index = models.IntegerField(null=True)
    time_taken_seconds = models.IntegerField(default=0)
    confidence_rating = models.IntegerField(default=3) # e.g. 1 to 5 scale for FSRS conversion

    def __str__(self):
        return f"{self.session.learner}'s Response to Q:{self.question.id} in Session:{self.session.id}"