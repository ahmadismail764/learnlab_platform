import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, AbstractUser

"""
We have two types of users: Admins and Learners.
They both have the following fields: [id, username, email, password, role, joined_at, last_login]
NOTE: The last_login field is automatically handled by Django's authentication system when using AbstractBaseUser. (Security purposes)

The Learner has extra fields: [current_xp, streak_count, last_practice_date]
"""

"""
NOTE: The default manager for any django model is supposed to Model.objects
However, AbstractBaseUser (which appears right below in the User class defintion) does not have the default manager.
So, we need to define a custom manager


"""
class User(AbstractUser):
    # Original field overwrites
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)

    # Fields specific to LearnLa
    # These are for learners only
    current_xp = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)

    # UI preferences persisted server-side (language, theme, notifications, etc.)
    preferences = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Admin: {self.username}" if self.is_superuser else f"Learner: {self.username}"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('user_register', 'User Registered'),
        ('user_login', 'User Logged In'),
        ('session_created', 'Practice Session Created'),
        ('session_completed', 'Practice Session Completed'),
        ('question_created', 'Question Created'),
        ('question_updated', 'Question Updated'),
        ('question_deleted', 'Question Deleted'),
        ('topic_created', 'Topic Created'),
        ('subtopic_created', 'Subtopic Created'),
        ('preferences_updated', 'Preferences Updated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    action_type = models.CharField(max_length=64, choices=ACTION_CHOICES, db_index=True)
    target_resource = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor} — {self.action_type} @ {self.timestamp}"