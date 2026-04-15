from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import Student

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
        return f"[{self.knowledge_point.topic.name}] Tier {self.tier}: {self.text[:50]}..."

# ... Practice Session Models ...

class PracticeSession(models.Model):
    SESSION_TYPES = (
        ('adaptive', 'Adaptive'),
        ('quiz', 'Quiz'),
        ('review', 'Review')
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='practice_sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='adaptive')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.session_type} Session {self.id} for {self.student.user.username}"

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
    Represents an FSRS 'Card' for spaced repetition per student/topic.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='masteries')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    # FSRS Card Fields
    state = models.IntegerField(default=0)                              # 0=New, 1=Learning, 2=Review, 3=Relearning
    difficulty = models.FloatField(default=0.0)
    stability = models.FloatField(default=0.0)
    reps = models.IntegerField(default=0)
    lapses = models.IntegerField(default=0)
    last_review_date = models.DateTimeField(null=True, blank=True)
    next_review_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'topic')  # One mastery record per student/topic