"""Render and send review-reminder emails.

Uses the project's configured EMAIL_BACKEND (console in dev, SMTP in prod) and
mirrors the plain-text ``render_to_string`` + ``send_mail`` approach already used
for the password-reset email in ``accounts.views``.
"""
import os
# Core django imports
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string


def send_review_reminder_email(user, payload):
    """Send the review-reminder digest in ``payload`` to ``user``.

    ``payload`` is the dict returned by
    ``notifications.reminders.build_review_reminder``. Raises whatever the email
    backend raises on failure (the command catches per-user so one bad address
    doesn't abort the batch).
    """
    first_name = user.first_name or user.username
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    body = render_to_string('notifications/emails/review_reminder.txt', {
        'first_name': first_name,
        'due_now_count': payload['due_now_count'],
        'due_subtopics': payload['due_subtopics'],
        'next_review_at': payload['next_review_at'],
        'practice_url': f"{frontend_url}/learner/practice",
    })

    count = payload['due_now_count']
    subject = f"LearnLab — you have {count} review{'s' if count != 1 else ''} due"

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
