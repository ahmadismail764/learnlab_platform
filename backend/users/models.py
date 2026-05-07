from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date, timedelta
import uuid


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff


class Learner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learner_profile')
    total_xp = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)

    def add_xp(self, amount):
        self.total_xp += amount
        self.save(update_fields=['total_xp'])

    def update_streak(self):
        today = date.today()
        if self.last_practice_date == today:
            return
        yesterday = today - timedelta(days=1)
        if self.last_practice_date == yesterday:
            self.streak_count += 1
        else:
            self.streak_count = 1
        self.last_practice_date = today
        self.save(update_fields=['streak_count', 'last_practice_date'])

    def __str__(self):
        return f"{self.user.username} (XP: {self.total_xp})"


@receiver(post_save, sender=User)
def create_learner_profile(sender, instance, created, **kwargs):
    if created and not instance.is_staff:
        Learner.objects.get_or_create(user=instance)

