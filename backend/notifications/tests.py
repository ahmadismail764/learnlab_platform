"""Tests for the review-reminder email notification system.

Covers the digest builder (``notifications.reminders.build_review_reminder``) and
the ``send_review_reminders`` management command: who gets emailed, opt-out,
once-per-day idempotency, --force, --dry-run and --only.

Django swaps in the in-memory email backend during tests, so anything "sent"
lands in ``django.core.mail.outbox``. Day-grouping/idempotency is UTC
(settings.TIME_ZONE = 'UTC').
"""
from datetime import timedelta
from io import StringIO

from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from notifications.models import NotificationLog
from notifications.reminders import build_review_reminder


def _mastery(learner, subtopic, next_review, *, state='REVIEW'):
    return SubtopicMastery.objects.create(
        learner=learner,
        subtopic=subtopic,
        state=state,
        last_review=(next_review - timedelta(days=1)) if next_review else None,
        next_review=next_review,
    )


class BuildReviewReminderTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(
            username='l', email='l@example.com', password='pw'
        )
        self.topic = Topic.objects.create(name='Discrete Math')
        # Anchor at noon UTC so a review and its expected day never straddle midnight.
        self.now = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0)

    def _sub(self, name):
        return Subtopic.objects.create(topic=self.topic, name=name)

    def test_none_when_nothing_due(self):
        _mastery(self.learner, self._sub('Sets'), self.now + timedelta(days=1))
        self.assertIsNone(build_review_reminder(self.learner, now=self.now))

    def test_ignores_unscheduled_masteries(self):
        _mastery(self.learner, self._sub('Sets'), None, state='NEW')
        self.assertIsNone(build_review_reminder(self.learner, now=self.now))

    def test_collects_due_and_overdue(self):
        _mastery(self.learner, self._sub('A'), self.now - timedelta(days=2))
        _mastery(self.learner, self._sub('B'), self.now)  # exactly now == due
        _mastery(self.learner, self._sub('C'), self.now + timedelta(days=3))  # future
        payload = build_review_reminder(self.learner, now=self.now)
        self.assertEqual(payload['due_now_count'], 2)
        self.assertEqual({s['name'] for s in payload['due_subtopics']}, {'A', 'B'})
        # next_review_at is the soonest FUTURE review (C), not one of the due ones.
        self.assertEqual(payload['next_review_at'], (self.now + timedelta(days=3)).date())
        self.assertEqual(payload['due_subtopics'][0]['topic_name'], 'Discrete Math')

    def test_only_this_learners_reviews(self):
        other = User.objects.create_user(username='o', email='o@example.com', password='pw')
        _mastery(other, self._sub('Theirs'), self.now - timedelta(hours=1))
        self.assertIsNone(build_review_reminder(self.learner, now=self.now))


class SendReviewRemindersCommandTests(TestCase):
    def setUp(self):
        self.topic = Topic.objects.create(name='Discrete Math')
        self.now = timezone.now()

    def _learner(self, username, email, **prefs):
        user = User.objects.create_user(username=username, email=email, password='pw')
        if prefs:
            user.preferences = prefs
            user.save(update_fields=['preferences'])
        return user

    def _due(self, learner, name):
        sub = Subtopic.objects.create(topic=self.topic, name=name)
        return _mastery(learner, sub, self.now - timedelta(hours=1))

    def _run(self, *args):
        out = StringIO()
        call_command('send_review_reminders', *args, stdout=out, stderr=StringIO())
        return out.getvalue()

    def test_emails_learner_with_due_reviews(self):
        learner = self._learner('a', 'a@example.com')
        self._due(learner, 'Sets')
        self._run()
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertEqual(msg.to, ['a@example.com'])
        self.assertIn('Sets', msg.body)
        self.assertEqual(NotificationLog.objects.filter(user=learner).count(), 1)

    def test_no_email_when_nothing_due(self):
        learner = self._learner('a', 'a@example.com')
        sub = Subtopic.objects.create(topic=self.topic, name='Later')
        _mastery(learner, sub, self.now + timedelta(days=2))  # future only
        self._run()
        self.assertEqual(len(mail.outbox), 0)

    def test_respects_opt_out(self):
        learner = self._learner('a', 'a@example.com', email_reminders=False)
        self._due(learner, 'Sets')
        self._run()
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(NotificationLog.objects.count(), 0)

    def test_idempotent_same_day(self):
        learner = self._learner('a', 'a@example.com')
        self._due(learner, 'Sets')
        self._run()
        self._run()  # second run, same day
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(NotificationLog.objects.filter(user=learner).count(), 1)

    def test_force_resends(self):
        learner = self._learner('a', 'a@example.com')
        self._due(learner, 'Sets')
        self._run()
        self._run('--force')
        self.assertEqual(len(mail.outbox), 2)

    def test_dry_run_sends_nothing_and_writes_no_log(self):
        learner = self._learner('a', 'a@example.com')
        self._due(learner, 'Sets')
        out = self._run('--dry-run')
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(NotificationLog.objects.count(), 0)
        self.assertIn('a@example.com', out)

    def test_only_restricts_recipient(self):
        a = self._learner('a', 'a@example.com')
        self._due(a, 'Sets')
        b = self._learner('b', 'b@example.com')
        self._due(b, 'Logic')
        self._run('--only', 'a@example.com')
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['a@example.com'])
