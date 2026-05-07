import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

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
class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        if not password:
            raise ValueError('The Password field must be set')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    # we need to set the following two ourselves
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email'] # username and password are already automatically required

    # Django admin/auth requirements
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # The str method is already implemented perfectly 
    # in the parent class AbstractBaseUser, we don't need to override it


# 2. The Learner Model (Handles extra data specific only to learners)
class LearnerProfile(models.Model):
    # The OneToOne link to the auth user
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learner_profile')
    
    # Your extra learner-specific fields go here!
    current_xp = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0) # This represents the number of consecutive times he practiced on time
    last_practice_date = models.DateField(null=True, blank=True) # might be useful for customization purposes
    
    def __str__(self):
        return f"Learner Profile for {self.user.username}"