"""Email each learner a digest of the subtopic reviews they have due.

This is the "push" half of the review notification system: it scans FSRS
scheduling state (``SubtopicMastery.next_review``) and emails every learner who
has reviews due right now. It is meant to run on a schedule — e.g. a daily cron —
and is idempotent per UTC day via ``NotificationLog``, so an hourly cron (or a
retry) won't email the same learner twice.

Adding a second channel later (e.g. web push) means calling another sender in the
same loop and logging it with a different ``channel`` — no new scheduler.

Examples
--------
    # Real run (respects opt-out + once-per-day dedup):
    python manage.py send_review_reminders

    # Show who WOULD be emailed; send nothing, write no logs:
    python manage.py send_review_reminders --dry-run

    # Ignore the once-per-day log (handy for a live demo):
    python manage.py send_review_reminders --force

    # Restrict to a single learner by email (test delivery):
    python manage.py send_review_reminders --only you@example.com
"""
from django.core.management.base import BaseCommand
from django.db import IntegrityError
from django.utils import timezone
# Our imports
from accounts.models import User
from topics.models import SubtopicMastery
from notifications.models import NotificationLog
from notifications.reminders import build_review_reminder
from notifications.emails import send_review_reminder_email

# Learners opt out by setting this preference to False; reminders are ON by default.
REMINDER_PREF_KEY = 'email_reminders'


class Command(BaseCommand):
    help = "Email learners a digest of the subtopic reviews they currently have due."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help="List who would be emailed; send nothing and write no logs.",
        )
        parser.add_argument(
            '--force', action='store_true',
            help="Send even if a reminder was already logged for today.",
        )
        parser.add_argument(
            '--only', type=str, default=None, metavar='EMAIL',
            help="Restrict to a single learner by email address (for testing).",
        )

    def handle(self, *args, **options):
        now = timezone.now()
        today = timezone.localdate(now)
        dry_run = options['dry_run']
        force = options['force']
        only = options['only']

        # Start from the learners who actually have something due — one indexed
        # query instead of scanning every user.
        due_learner_ids = (
            SubtopicMastery.objects
            .filter(next_review__isnull=False, next_review__lte=now)
            .values_list('learner_id', flat=True)
            .distinct()
        )
        learners = User.objects.filter(id__in=due_learner_ids)
        if only:
            learners = learners.filter(email__iexact=only)

        sent = optout = already = no_due = failed = 0

        for learner in learners.iterator():
            if not learner.email:
                continue

            # Opt-out check (reminders default ON).
            if learner.preferences.get(REMINDER_PREF_KEY, True) is False:
                optout += 1
                continue

            # Once-per-day idempotency (unless --force).
            if not force and NotificationLog.objects.filter(
                user=learner,
                kind=NotificationLog.Kind.REVIEW_REMINDER,
                channel=NotificationLog.Channel.EMAIL,
                sent_date=today,
            ).exists():
                already += 1
                continue

            payload = build_review_reminder(learner, now=now)
            if not payload:  # nothing due after all (e.g. a race) — skip silently
                no_due += 1
                continue

            if dry_run:
                self.stdout.write(
                    f"[dry-run] would email {learner.email}: "
                    f"{payload['due_now_count']} due"
                )
                sent += 1
                continue

            try:
                send_review_reminder_email(learner, payload)
            except Exception as exc:  # one bad address shouldn't abort the batch
                failed += 1
                self.stderr.write(self.style.ERROR(f"failed for {learner.email}: {exc}"))
                continue

            # Record the send so we don't repeat it today. The try/except guards
            # the unique constraint against a concurrent run.
            try:
                NotificationLog.objects.create(
                    user=learner,
                    kind=NotificationLog.Kind.REVIEW_REMINDER,
                    channel=NotificationLog.Channel.EMAIL,
                    sent_date=today,
                    context={'due_now_count': payload['due_now_count']},
                )
            except IntegrityError:
                pass
            sent += 1

        summary = (
            f"Review reminders: sent={sent} opted_out={optout} "
            f"already_sent_today={already} no_due={no_due} failed={failed}"
            + (" (dry-run)" if dry_run else "")
        )
        self.stdout.write(self.style.SUCCESS(summary))
