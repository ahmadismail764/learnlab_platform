from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import date, timedelta

class User(AbstractUser):
    """
    Custom User model.
    Extends AbstractUser to allow future customization (e.g. login by email).
    """
    ROLE_CHOICES = (
        ('learner', 'Learner'),
        ('admin', 'Admin'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='learner')
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def is_locked(self):
        from django.utils import timezone
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return True
        return False

    # You can add the 'updateEmail' logic as a method here or in a serializer later
    def __str__(self):
        return self.username

class Learner(models.Model):
    """
    The Learner profile. Holds gamification data.
    Linked 1-to-1 with the User.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learner_profile')
    total_xp = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)
    
    def add_xp(self, amount):
        """Add XP to the learner. Does NOT auto-save — caller must save."""
        self.total_xp += amount
        
    def update_streak(self):
        """
        Updates the learner's streak based on the last practice date.
        - If yesterday: increment streak.
        - If today: do nothing (already practiced).
        - Otherwise (gap or first time): reset streak to 1.
        Always saves the learner instance.
        """
        today = date.today()
        if self.last_practice_date == today:
            self.save()
            return  # Already practiced today
        
        yesterday = today - timedelta(days=1)
        if self.last_practice_date == yesterday:
            self.streak_count += 1
        else:
            self.streak_count = 1
        
        self.last_practice_date = today
        self.save()
        
    def __str__(self):
        return f"{self.user.username} (XP: {self.total_xp})"

# Note: Admin is handled by Django's built-in is_staff/is_superuser flags,
# so we don't strictly need a separate Admin model unless you have specific admin-only fields.