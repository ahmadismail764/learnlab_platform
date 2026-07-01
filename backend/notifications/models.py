import uuid
# Core django imports
from django.db import models
# Our imports
from accounts.models import User


class NotificationLog(models.Model):
    """A record that we sent one notification to one user — for idempotency + audit.

    A row here means: "we sent <kind> to <user> over <channel> on <sent_date>".

    The whole point is the unique constraint on (user, kind, channel, sent_date):
    it makes the daily reminder job *idempotent per day*. The command is meant to
    run on a schedule, and a cron that fires hourly (or a retried run) must not
    email the same learner twice — the log is how we know we've already sent
    today. ``sent_date`` is a UTC date (settings.TIME_ZONE = 'UTC').

    It's deliberately channel-agnostic so a future push channel drops in without
    a schema change (channel='webpush').
    """

    class Kind(models.TextChoices):
        REVIEW_REMINDER = 'review_reminder', 'Review reminder'

    class Channel(models.TextChoices):
        EMAIL = 'email', 'Email'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_logs')
    kind = models.CharField(max_length=32, choices=Kind.choices)
    channel = models.CharField(max_length=16, choices=Channel.choices, default=Channel.EMAIL)

    # UTC date the notification went out; the unit of "once per day" dedup.
    sent_date = models.DateField(help_text="UTC date this notification was sent (daily idempotency key).")
    created_at = models.DateTimeField(auto_now_add=True)

    # Snapshot of what was sent (e.g. {"due_now_count": 5}); handy for auditing.
    context = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'kind', 'channel', 'sent_date'],
                name='uniq_notification_per_user_kind_channel_day',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'sent_date']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} · {self.kind} · {self.channel} · {self.sent_date}"
