from django.db import models
from django.conf import settings  # To refer to the User model

# We need to reference the Student model from the users app
from users.models import Student

class Topic(models.Model):
    name = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name

class Question(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField(help_text="The question string")
    
    # specific to Postgres - perfect for "choices: List"
    # Format example: ["Paris", "London", "Berlin"]
    choices = models.JSONField(default=list) 
    
    correct_answer_index = models.IntegerField(help_text="Index of the correct answer in the choices list")
    
    def __str__(self):
        return f"{self.text[:50]}..."

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