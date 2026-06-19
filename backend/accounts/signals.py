from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='accounts.User')
def log_user_register(sender, instance, created, **kwargs):
    if not created:
        return
    from accounts.models import AuditLog
    AuditLog.objects.create(
        actor=instance,
        action_type='user_register',
        target_resource=f'User/{instance.id}',
        metadata={'username': instance.username, 'email': instance.email},
    )


@receiver(post_save, sender='practice.PracticeSession')
def log_session_created(sender, instance, created, **kwargs):
    if not created:
        return
    from accounts.models import AuditLog
    AuditLog.objects.create(
        actor=instance.learner,
        action_type='session_created',
        target_resource=f'PracticeSession/{instance.id}',
        metadata={'learner_id': str(instance.learner_id)},
    )
