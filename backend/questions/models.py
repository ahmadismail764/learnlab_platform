from django.db import models
from django.conf import settings
from users.models import Learner

class Topic(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Short summary of the topic") # <--- NEW
    parent_module = models.CharField(max_length=255, blank=True, help_text="e.g. Discrete Math > Logic") # <--- NEW
    
    prerequisites = models.ManyToManyField('self', symmetrical=False, related_name='prerequisite_for', blank=True, help_text="Topics that must be known before learning this topic")
    
    def __str__(self):
        return self.name

class Encompassing(models.Model):
    advanced_topic = models.ForeignKey(Topic, related_name='encompasses', on_delete=models.CASCADE)
    simple_topic = models.ForeignKey(Topic, related_name='encompassed_by', on_delete=models.CASCADE)
    weight = models.FloatField(default=1.0, help_text="Fraction of credit passed down")

    class Meta:
        unique_together = ('advanced_topic', 'simple_topic')

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.advanced_topic == self.simple_topic:
            raise ValidationError("A topic cannot encompass itself.")

class KnowledgePoint(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='knowledge_points')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Detailed description of this specific bit of knowledge")
    
    def __str__(self):
        return f"{self.topic.name} - {self.name}"

class Question(models.Model):
    knowledge_point = models.ForeignKey(KnowledgePoint, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    text = models.TextField(help_text="The question string")
    choices = models.JSONField(default=list) 
    correct_answer_index = models.IntegerField()
    
    # Adaptive Scaffolding Field
    tier = models.IntegerField(default=1, help_text="1=Concept, 2=Application, 3=Synthesis") # <--- NEW
    explanation_video_url = models.URLField(null=True, blank=True)
    
    def __str__(self):
        topic_name = self.knowledge_point.topic.name if self.knowledge_point else 'Unlinked'
        return f"[{topic_name}] Tier {self.tier}: {self.text[:50]}..."

# ... Practice Session Models ...

class PracticeSession(models.Model):
    SESSION_TYPES = (
        ('adaptive', 'Adaptive'),
        ('quiz', 'Quiz'),
        ('review', 'Review')
    )
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='practice_sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='adaptive')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.session_type} Session {self.id} for {self.learner.user.username}"

class SingleQuestionInteraction(models.Model):
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='interactions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_response = models.CharField(max_length=255, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    time_taken_seconds = models.FloatField(default=0.0)
    confidence_rating = models.IntegerField(default=1, help_text="1=Guess, 5=Sure")
    
    def __str__(self):
        return f"Interaction for Q{self.question.id} in Session {self.session.id}"

class TopicMastery(models.Model):
    """
    Tracks a learner's mastery of a specific topic using FSRS.
    """
    STATE_CHOICES = (
        ('new', 'New'),
        ('learning', 'Learning'),
        ('review', 'Review'),
        ('relearning', 'Relearning'),
    )
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='masteries')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    difficulty = models.FloatField(default=5.0, help_text="FSRS difficulty parameter (1–10)")
    stability = models.FloatField(default=1.0, help_text="FSRS stability in days")
    reps = models.IntegerField(default=0, help_text="Number of successful reviews")
    lapses = models.IntegerField(default=0, help_text="Number of times forgotten")
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='new')

    last_review = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('learner', 'topic')

class Notification(models.Model):
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='notifications')
    topics = models.ManyToManyField(Topic)
    sent_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)