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

    def __str__(self):
        return f"Admin: {self.username}" if self.is_superuser else f"Learner: {self.username}"