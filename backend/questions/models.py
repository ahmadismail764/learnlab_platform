from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import Learner

class Topic(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Short summary of the topic") # <--- NEW
    parent_module = models.CharField(max_length=255, blank=True, help_text="e.g. Discrete Math > Logic") # <--- NEW
    
    prerequisites = models.ManyToManyField('self', symmetrical=False, related_name='prerequisite_for', blank=True, help_text="Topics that must be known before learning this topic")
    encompassings = models.ManyToManyField('self', symmetrical=False, related_name='encompassed_by', blank=True, help_text="Simpler topics that are implicitly practiced when this topic is practiced")
    
    def __str__(self):
        return self.name

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
    Tracks a learner's mastery of a specific topic.
    """
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='masteries')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    mastery_level = models.FloatField(default=0.0, help_text="Mastery level from 0.0 to 100.0")

    class Meta:
        unique_together = ('learner', 'topic')  # One mastery record per learner/topic