from django.db import models
from accounts.models import User
from topics.models import Subtopic
import uuid

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
    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='practice_sessions')

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
    time_taken_seconds = models.IntegerField(default=0)
    confidence_rating = models.IntegerField(default=3) # e.g. 1 to 5 scale

    def __str__(self):
        return f"{self.session.learner}'s Response to Q:{self.question.id} in Session:{self.session.id}"


