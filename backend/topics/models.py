import uuid
from django.db import models
from accounts.models import User

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
        return self.name


class SubtopicMastery(models.Model):
    """A learner's FSRS memory state for one subtopic.

    The *existence* of a row is also the enrollment signal: a learner has a
    SubtopicMastery for a subtopic iff they are studying (enrolled in) it. The
    ``unique_together`` below guarantees one row per (learner, subtopic), so
    enrollment can never be ambiguous or duplicated. Enrolling creates the row
    (state NEW); unenrolling deletes it. There is no separate enrollment table
    or status field — see topics.views.EnrollmentViewSet and
    practice.views.questions_for_learner.
    """

    class StateChoices(models.TextChoices):
        NEW = 'NEW', 'New'
        LEARNING = 'LEARNING', 'Learning'
        REVIEW = 'REVIEW', 'Review'
        RELEARNING = 'RELEARNING', 'Relearning'
    
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='masteries')
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
    next_review = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        unique_together = ('learner', 'subtopic')

    def __str__(self):
        return f"{self.learner} | {self.subtopic.name} | {self.state}"