from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model.
    Extends AbstractUser to allow future customization (e.g. login by email).
    """
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # You can add the 'updateEmail' logic as a method here or in a serializer later
    def __str__(self):
        return self.username

class Student(models.Model):
    """
    The Student profile. Holds gamification data.
    Linked 1-to-1 with the User.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    xp = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)
    
    def add_xp(self, amount):
        self.xp += amount
        self.save()
        
    def __str__(self):
        return f"{self.user.username} (XP: {self.xp})"

# Note: Admin is handled by Django's built-in is_staff/is_superuser flags,
# so we don't strictly need a separate Admin model unless you have specific admin-only fields.