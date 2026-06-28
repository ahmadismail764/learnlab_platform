"""Tests for the FSRS review-forecast feature.

Covers the engine helper (``get_review_forecast``) and the two API surfaces that
expose it: ``GET /api/v1/practice/review-forecast/`` and the ``next_review``
headline appended to the session-completion response.

Day-grouping is in UTC (settings.TIME_ZONE = 'UTC'). Tests anchor ``now`` at
noon so a review and its expected day never straddle midnight.
"""
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.models import PracticeSession, Question, QuestionResponse
from practice.constants import DEFAULT_FORECAST_DAYS, MAX_FORECAST_DAYS
from practice.fsrs_engine import get_review_forecast


def _make_mastery(learner, subtopic, next_review, *, state='REVIEW'):
    """Create a SubtopicMastery scheduled at ``next_review`` (or unscheduled if None)."""
    return SubtopicMastery.objects.create(
        learner=learner,
        subtopic=subtopic,
        state=state,
        last_review=(next_review - timedelta(days=1)) if next_review else None,
        next_review=next_review,
    )


class ReviewForecastEngineTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(
            username='learner', email='l@example.com', password='pw'
        )
        self.topic = Topic.objects.create(name='Discrete Math')
        # Anchor at noon UTC so day-grouping never straddles midnight.
        self.now = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0)

    def _subtopic(self, name):
        return Subtopic.objects.create(topic=self.topic, name=name)

    def test_empty_when_no_masteries(self):
        result = get_review_forecast(self.learner, now=self.now)
        self.assertEqual(result['window_days'], DEFAULT_FORECAST_DAYS)
        self.assertIsNone(result['next_review_at'])
        self.assertEqual(result['due_now_count'], 0)
        self.assertEqual(result['forecast'], [])

    def test_ignores_masteries_without_next_review(self):
        # A brand-new, never-reviewed card has next_review=None and must not count.
        _make_mastery(self.learner, self._subtopic('Sets'), None, state='NEW')
        result = get_review_forecast(self.learner, now=self.now)
        self.assertIsNone(result['next_review_at'])
        self.assertEqual(result['due_now_count'], 0)
        self.assertEqual(result['forecast'], [])

    def test_counts_overdue_and_due_now_as_due_now(self):
        _make_mastery(self.learner, self._subtopic('A'), self.now - timedelta(days=2))
        _make_mastery(self.learner, self._subtopic('B'), self.now - timedelta(hours=1))
        _make_mastery(self.learner, self._subtopic('C'), self.now)  # exactly now -> due
        result = get_review_forecast(self.learner, now=self.now)
        self.assertEqual(result['due_now_count'], 3)
        self.assertEqual(result['forecast'], [])
        self.assertIsNone(result['next_review_at'])

    def test_groups_future_reviews_by_day_with_subtopics(self):
        _make_mastery(self.learner, self._subtopic('D2-a'), self.now + timedelta(days=2))
        _make_mastery(self.learner, self._subtopic('D2-b'), self.now + timedelta(days=2, hours=3))
        _make_mastery(self.learner, self._subtopic('D5'), self.now + timedelta(days=5))
        result = get_review_forecast(self.learner, now=self.now)

        self.assertEqual(result['due_now_count'], 0)
        self.assertEqual(result['next_review_at'], (self.now + timedelta(days=2)).date())
        self.assertEqual(len(result['forecast']), 2)

        day0 = result['forecast'][0]
        self.assertEqual(day0['date'], (self.now + timedelta(days=2)).date())
        self.assertEqual(day0['due_count'], 2)
        self.assertEqual({s['name'] for s in day0['subtopics']}, {'D2-a', 'D2-b'})

        day1 = result['forecast'][1]
        self.assertEqual(day1['date'], (self.now + timedelta(days=5)).date())
        self.assertEqual([s['name'] for s in day1['subtopics']], ['D5'])

    def test_subtopic_entry_has_names_topic_and_metadata(self):
        s = self._subtopic('Graph Coloring')
        _make_mastery(self.learner, s, self.now + timedelta(days=1))
        result = get_review_forecast(self.learner, now=self.now)

        sub = result['forecast'][0]['subtopics'][0]
        self.assertEqual(sub['id'], s.id)
        self.assertEqual(sub['name'], 'Graph Coloring')
        self.assertEqual(sub['topic_id'], self.topic.id)
        self.assertEqual(sub['topic_name'], 'Discrete Math')
        self.assertEqual(sub['state'], 'REVIEW')
        self.assertIn('next_review', sub)

    def test_window_excludes_reviews_beyond_requested_days(self):
        far = self._subtopic('Far')
        _make_mastery(self.learner, far, self.now + timedelta(days=10))

        # Default 7-day window: nothing in the agenda, but it's still the soonest.
        result = get_review_forecast(self.learner, days=7, now=self.now)
        self.assertEqual(result['forecast'], [])
        self.assertEqual(result['next_review_at'], (self.now + timedelta(days=10)).date())

        # Widen to 14 days: now it shows up.
        result2 = get_review_forecast(self.learner, days=14, now=self.now)
        self.assertEqual(len(result2['forecast']), 1)
        self.assertEqual(result2['forecast'][0]['subtopics'][0]['name'], 'Far')

    def test_window_days_is_clamped(self):
        self.assertEqual(
            get_review_forecast(self.learner, days=999, now=self.now)['window_days'],
            MAX_FORECAST_DAYS,
        )
        self.assertEqual(
            get_review_forecast(self.learner, days=0, now=self.now)['window_days'], 1
        )
        self.assertEqual(
            get_review_forecast(self.learner, days=-5, now=self.now)['window_days'], 1
        )

    def test_mixes_due_now_and_future(self):
        _make_mastery(self.learner, self._subtopic('Overdue'), self.now - timedelta(days=1))
        _make_mastery(self.learner, self._subtopic('Soon'), self.now + timedelta(days=1))
        result = get_review_forecast(self.learner, now=self.now)
        self.assertEqual(result['due_now_count'], 1)
        self.assertEqual(len(result['forecast']), 1)
        self.assertEqual(result['next_review_at'], (self.now + timedelta(days=1)).date())

    def test_only_counts_requesting_learner(self):
        other = User.objects.create_user(username='other', email='o@example.com', password='pw')
        _make_mastery(self.learner, self._subtopic('Mine'), self.now + timedelta(days=1))
        _make_mastery(other, self._subtopic('Theirs'), self.now + timedelta(days=1))
        result = get_review_forecast(self.learner, now=self.now)
        self.assertEqual(sum(d['due_count'] for d in result['forecast']), 1)
        self.assertEqual(result['forecast'][0]['subtopics'][0]['name'], 'Mine')


class ReviewForecastAPITests(APITestCase):
    def setUp(self):
        self.learner = User.objects.create_user(
            username='learner', email='l@example.com', password='pw'
        )
        self.topic = Topic.objects.create(name='Discrete Math')
        self.now = timezone.now()

    def _subtopic(self, name):
        return Subtopic.objects.create(topic=self.topic, name=name)

    def test_requires_authentication(self):
        resp = self.client.get(reverse('review-forecast'))
        self.assertIn(
            resp.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_returns_forecast_for_authenticated_learner(self):
        _make_mastery(self.learner, self._subtopic('A'), self.now - timedelta(days=1))  # due now
        _make_mastery(self.learner, self._subtopic('B'), self.now + timedelta(days=3))  # future
        self.client.force_authenticate(self.learner)

        resp = self.client.get(reverse('review-forecast'))

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['window_days'], DEFAULT_FORECAST_DAYS)
        self.assertEqual(resp.data['due_now_count'], 1)
        self.assertEqual(len(resp.data['forecast']), 1)
        day = resp.data['forecast'][0]
        self.assertEqual(day['due_count'], 1)
        self.assertEqual(day['subtopics'][0]['name'], 'B')
        self.assertIsNotNone(resp.data['next_review_at'])

    def test_days_query_param_widens_window(self):
        _make_mastery(self.learner, self._subtopic('Far'), self.now + timedelta(days=10))
        self.client.force_authenticate(self.learner)

        # Default window (7d): not in the agenda.
        default_resp = self.client.get(reverse('review-forecast'))
        self.assertEqual(default_resp.data['forecast'], [])

        # ?days=14: appears.
        wide_resp = self.client.get(reverse('review-forecast'), {'days': 14})
        self.assertEqual(wide_resp.data['window_days'], 14)
        self.assertEqual(len(wide_resp.data['forecast']), 1)
        self.assertEqual(wide_resp.data['forecast'][0]['subtopics'][0]['name'], 'Far')

    def test_invalid_days_param_falls_back_to_default(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.get(reverse('review-forecast'), {'days': 'abc'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['window_days'], DEFAULT_FORECAST_DAYS)

    def test_forecast_is_learner_isolated(self):
        other = User.objects.create_user(username='other', email='o@example.com', password='pw')
        _make_mastery(other, self._subtopic('Theirs'), self.now + timedelta(days=1))
        self.client.force_authenticate(self.learner)

        resp = self.client.get(reverse('review-forecast'))

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['due_now_count'], 0)
        self.assertEqual(list(resp.data['forecast']), [])
        self.assertIsNone(resp.data['next_review_at'])

    def test_session_completion_includes_next_review_headline(self):
        # Answer one question, then complete the session: FSRS should schedule the
        # answered subtopic and the response should carry the next-review headline.
        subtopic = self._subtopic('Logic')
        question = Question.objects.create(
            subtopic=subtopic, tier=1, text='p AND q?',
            choices=['True', 'False'], correct_answer_index=0,
        )
        session = PracticeSession.objects.create(learner=self.learner)
        QuestionResponse.objects.create(
            session=session, question=question,
            selected_answer_index=0, is_correct=True,
        )
        self.client.force_authenticate(self.learner)

        resp = self.client.patch(
            reverse('session-detail', kwargs={'pk': session.pk}),
            {'end_time': timezone.now().isoformat()},
            format='json',
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('next_review', resp.data)
        for key in ('window_days', 'next_review_at', 'due_now_count', 'forecast'):
            self.assertIn(key, resp.data['next_review'])
        # A correct review schedules the subtopic into the future (not due now).
        self.assertIsNotNone(resp.data['next_review']['next_review_at'])
        # And the just-reviewed subtopic now has a next_review in the DB.
        mastery = SubtopicMastery.objects.get(learner=self.learner, subtopic=subtopic)
        self.assertIsNotNone(mastery.next_review)
