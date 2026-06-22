"""Tests for the FSRS v1 scheduling engine.

Kept in its own module because practice/tests.py currently imports symbols that
no longer exist, which would otherwise prevent these from running.

Note on assertions: the scheduler keeps FSRS's default interval *fuzzing* on, so
exact day counts wobble between runs. Tests therefore assert on monotonic
stability (not fuzzed) and on loose interval bounds, never exact intervals.
"""
from django.test import TestCase
from django.utils import timezone

import fsrs
from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.models import PracticeSession, Question, QuestionResponse
from practice.fsrs_engine import (
    apply_fsrs,
    preview_schedule,
    process_review,
    process_session,
    aggregate_session_to_fsrs_rating,
    accuracy_to_speed,
)


class FsrsEngineTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(
            username='learner', email='l@example.com', password='pw'
        )
        self.topic = Topic.objects.create(name='Math')
        self.subtopic = Subtopic.objects.create(topic=self.topic, name='Algebra')

    def _fresh_mastery(self):
        return SubtopicMastery.objects.create(
            learner=self.learner, subtopic=self.subtopic
        )

    def test_new_card_good_gives_about_one_day(self):
        m = self._fresh_mastery()
        apply_fsrs(m, fsrs.Rating.Good)
        interval = (m.next_review - m.last_review).total_seconds() / 86400
        self.assertGreaterEqual(interval, 0.9)
        self.assertLessEqual(interval, 2.0)
        self.assertEqual(m.state, 'REVIEW')
        self.assertEqual(m.reps, 1)
        self.assertEqual(m.lapses, 0)

    def test_no_hard_seed_keeps_difficulty_low_after_first_good(self):
        # A fresh card answered correctly should NOT start out as a hard card.
        m = self._fresh_mastery()
        apply_fsrs(m, fsrs.Rating.Good)
        self.assertLess(m.difficulty, 5.0)

    def test_consecutive_good_reviews_grow_stability(self):
        m = self._fresh_mastery()
        now = timezone.now()
        stabilities = []
        for _ in range(5):
            apply_fsrs(m, fsrs.Rating.Good, now=now)
            stabilities.append(m.stability)
            now = m.next_review
        # Stability (not fuzzed) must strictly increase across good reviews.
        self.assertEqual(stabilities, sorted(stabilities))
        self.assertEqual(len(set(stabilities)), len(stabilities))
        self.assertEqual(m.reps, 5)

    def test_interval_never_exceeds_max_cap(self):
        from practice.constants import MAX_INTERVAL_DAYS
        m = self._fresh_mastery()
        now = timezone.now()
        # A long perfect streak would blow past the cap without it.
        for _ in range(20):
            apply_fsrs(m, fsrs.Rating.Good, now=now)
            interval = (m.next_review - now).total_seconds() / 86400
            self.assertLessEqual(interval, MAX_INTERVAL_DAYS + 1e-6)
            now = m.next_review
        # And it should actually reach the ceiling, not just stay small.
        final_interval = (m.next_review - m.last_review).total_seconds() / 86400
        self.assertAlmostEqual(final_interval, MAX_INTERVAL_DAYS, places=3)

    def test_min_interval_is_at_least_one_day(self):
        # Even a wrong answer never schedules sub-day (FSRS floors review at 1d).
        m = self._fresh_mastery()
        now = timezone.now()
        for rating in (fsrs.Rating.Good, fsrs.Rating.Again, fsrs.Rating.Again):
            apply_fsrs(m, rating, now=now)
            interval = (m.next_review - now).total_seconds() / 86400
            self.assertGreaterEqual(interval, 1.0 - 1e-6)
            now = m.next_review

    def test_wrong_answer_shortens_interval_and_records_lapse(self):
        m = self._fresh_mastery()
        now = timezone.now()
        for _ in range(3):
            apply_fsrs(m, fsrs.Rating.Good, now=now)
            now = m.next_review
        interval_before = (m.next_review - m.last_review).total_seconds() / 86400

        apply_fsrs(m, fsrs.Rating.Again, now=now)
        interval_after = (m.next_review - m.last_review).total_seconds() / 86400

        self.assertLess(interval_after, interval_before)
        self.assertEqual(m.lapses, 1)
        self.assertGreater(m.difficulty, 5.0)  # forgetting makes the card harder

    def test_preview_does_not_mutate_or_save(self):
        m = self._fresh_mastery()
        before = (m.state, m.stability, m.difficulty, m.reps)

        result = preview_schedule(m, fsrs.Rating.Good)

        self.assertIn('interval_days', result)
        self.assertGreater(result['interval_days'], 0)
        # In-memory instance untouched...
        self.assertEqual((m.state, m.stability, m.difficulty, m.reps), before)
        # ...and nothing was written to the DB.
        m.refresh_from_db()
        self.assertEqual(m.state, 'NEW')

    def test_aggregate_session_rating(self):
        self.assertEqual(
            aggregate_session_to_fsrs_rating([True, True, True]), fsrs.Rating.Good
        )
        self.assertEqual(
            aggregate_session_to_fsrs_rating([True, False, True]), fsrs.Rating.Again
        )
        # tuple form from the original simulation script
        self.assertEqual(
            aggregate_session_to_fsrs_rating([(True,), (True,)]), fsrs.Rating.Good
        )
        # empty session is treated as a pass
        self.assertEqual(aggregate_session_to_fsrs_rating([]), fsrs.Rating.Good)

    def test_aggregate_accepts_question_responses(self):
        session = PracticeSession.objects.create(learner=self.learner)
        q = Question.objects.create(
            subtopic=self.subtopic, tier=1, text='2+2?',
            choices=['3', '4'], correct_answer_index=1,
        )
        r1 = QuestionResponse.objects.create(session=session, question=q, is_correct=True)
        r2 = QuestionResponse.objects.create(session=session, question=q, is_correct=False)
        self.assertEqual(aggregate_session_to_fsrs_rating([r1]), fsrs.Rating.Good)
        self.assertEqual(aggregate_session_to_fsrs_rating([r1, r2]), fsrs.Rating.Again)

    def test_accuracy_to_speed_is_bounded(self):
        self.assertAlmostEqual(accuracy_to_speed(0.5), 0.2333, places=3)
        self.assertEqual(accuracy_to_speed(0.0), 0.2)   # clamped low
        self.assertEqual(accuracy_to_speed(2.0), 0.4)   # clamped high
        # within range, stays inside the [0.2, 0.4] band
        self.assertLessEqual(accuracy_to_speed(1.0), 0.4)

    def test_process_review_creates_persists_and_returns_dict(self):
        self.assertEqual(SubtopicMastery.objects.count(), 0)
        result = process_review(self.learner, self.subtopic, is_correct=True)

        m = SubtopicMastery.objects.get(learner=self.learner, subtopic=self.subtopic)
        self.assertEqual(m.reps, 1)
        self.assertIsNotNone(m.next_review)
        self.assertEqual(m.state, 'REVIEW')

        # CONTRACT: returns the full schedule dict
        self.assertEqual(result['state'], 'REVIEW')
        self.assertEqual(result['next_review'], m.next_review)
        self.assertEqual(result['reps'], 1)
        self.assertGreater(result['interval_days'], 0)
        for key in ('stability', 'difficulty', 'lapses', 'last_review'):
            self.assertIn(key, result)

    def test_process_session_aggregates_one_review_per_subtopic(self):
        session = PracticeSession.objects.create(learner=self.learner)
        responses = []
        for correct in (True, False, True):  # 3 answers, same subtopic, one wrong
            q = Question.objects.create(
                subtopic=self.subtopic, tier=1, text='q',
                choices=['1', '2'], correct_answer_index=0,
            )
            responses.append(QuestionResponse.objects.create(
                session=session, question=q, is_correct=correct,
            ))

        results = process_session(self.learner, responses=responses)

        m = SubtopicMastery.objects.get(learner=self.learner, subtopic=self.subtopic)
        # Exactly ONE aggregated review for the subtopic, not three.
        self.assertEqual(m.reps + m.lapses, 1)
        # One wrong answer in the group -> the whole subtopic counts as a lapse.
        self.assertEqual(m.lapses, 1)
        self.assertIn(self.subtopic.id, results)
        self.assertEqual(results[self.subtopic.id]['state'], m.state)
