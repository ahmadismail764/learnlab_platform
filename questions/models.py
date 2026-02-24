from django.db import models
from django.conf import settings 
from users.models import Student

class Topic(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Short summary of the topic") # <--- NEW
    parent_module = models.CharField(max_length=255, blank=True, help_text="e.g. Discrete Math > Logic") # <--- NEW
    
    def __str__(self):
        return self.name

class Question(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField(help_text="The question string")
    choices = models.JSONField(default=list) 
    correct_answer_index = models.IntegerField()
    
    # Adaptive Scaffolding Field
    tier = models.IntegerField(default=1, help_text="1=Concept, 2=Application, 3=Synthesis") # <--- NEW
    
    def __str__(self):
        return f"[{self.topic.name}] Tier {self.tier}: {self.text[:50]}..."

# ... Keep PracticeSheet, Submission, Answer, TopicMastery as they were ...

class PracticeSheet(models.Model):
    # If a sheet is a collection of specific questions:
    questions = models.ManyToManyField(Question, related_name='practice_sheets')
    total_xp = models.IntegerField(default=0)
    
    # "Constructor" logic usually goes in a Manager or Serializer in Django,
    # but you can add a classmethod here if you like.
    
    def __str__(self):
        return f"Sheet {self.id} - {self.total_xp} XP" 

class Submission(models.Model):
    """
    Corresponds to 'Practice Sheet Submission'
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions')
    sheet = models.ForeignKey(PracticeSheet, on_delete=models.CASCADE, related_name='submissions')
    time_taken = models.DurationField(null=True, blank=True) # or IntegerField for seconds
    submitted_at = models.DateTimeField(auto_now_add=True)

    def calculate_xp(self):
        # Logic to sum up XP based on answers
        pass

class Answer(models.Model):
    """
    Corresponds to 'Single Question Answer'
    """
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer_index = models.IntegerField(null=True)
    confidence = models.FloatField(help_text="User confidence level (e.g. 0.0 to 1.0)")
    # time_taken was crossed out in your diagram, so omitting it.

class TopicMastery(models.Model):
    """
    For the Spaced Repetition Algorithm (SRS)
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='masteries')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    
    # SRS Parameters
    difficulty = models.FloatField(default=2.5) # Common default in algorithms like SM-2
    stability = models.FloatField(default=0.0)
    last_review_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'topic') # A student has one mastery record per topic