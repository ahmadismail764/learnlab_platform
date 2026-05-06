from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.db.models.signals import post_save
from datetime import date, timedelta

class LearnerManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(role='learner')

class AdminManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(role='admin')

class User(AbstractUser):
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
        return bool(self.account_locked_until and self.account_locked_until > timezone.now())

    def __str__(self):
        return self.email

class LearnerUser(User):
    objects = LearnerManager()
    
    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        if not self.pk:
            self.role = 'learner'
        super().save(*args, **kwargs)

    @property
    def profile(self):
        return self.learner_profile


class AdminUser(User):
    objects = AdminManager()
    
    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        if not self.pk:
            self.role = 'admin'
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)
        
    @property
    def profile(self):
        return self.admin_profile


class Learner(models.Model):
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
            self.save()
            return
        
        yesterday = today - timedelta(days=1)
        if self.last_practice_date == yesterday:
            self.streak_count += 1
        else:
            self.streak_count = 1
        
        self.last_practice_date = today
        self.save()
        
    def __str__(self):
        return f"{self.user.username} (XP: {self.total_xp})"

class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    
    def __str__(self):
        return f"Admin: {self.user.username}"


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'learner':
            Learner.objects.get_or_create(user=instance)
        elif instance.role == 'admin':
            AdminProfile.objects.get_or_create(user=instance)

for model in [User, LearnerUser, AdminUser]:
    post_save.connect(create_user_profile, sender=model)
