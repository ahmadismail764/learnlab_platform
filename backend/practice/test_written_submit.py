"""Integration tests for submitting written (free-response) answers.

Exercises the PATCH .../sessions/{id}/responses/{question_id}/ endpoint for the
written-answer path: correct/incorrect grading, the invalid -> 422 "return to
learner" behaviour (which must NOT finalize the response), already-answered
guarding, and an MCQ regression check so the shared endpoint still works.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from topics.models import Topic, Subtopic
from practice.models import PracticeSession, Question, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER


class WrittenSubmitTests(APITestCase):
    def setUp(self):
        self.learner = User.objects.create_user(
            username='learner', email='l@example.com', password='pw'
        )
        self.client.force_authenticate(user=self.learner)
        self.topic = Topic.objects.create(name='Algebra')
        self.subtopic = Subtopic.objects.create(topic=self.topic, name='Polynomials')

    # --- helpers ---------------------------------------------------------
    def _written_question(self, correct_answer='2*x'):
        return Question.objects.create(
            subtopic=self.subtopic,
            tier=1,
            question_type=Question.QuestionType.WRITTEN,
            grading_method=Question.GradingMethod.CAS,
            text='Simplify x + x',
            correct_answer=correct_answer,
        )

    def _mcq_question(self):
        return Question.objects.create(
            subtopic=self.subtopic,
            tier=1,
            text='What is 1 + 1?',
            choices=['1', '2', '3', '4'],
            correct_answer_index=1,
        )

    def _session_with(self, question):
        session = PracticeSession.objects.create(learner=self.learner)
        response = QuestionResponse.objects.create(
            session=session, question=question, selected_answer_index=None, is_correct=False
        )
        return session, response

    def _url(self, session, question):
        return reverse('session-submit-response',
                       kwargs={'pk': str(session.id), 'question_id': str(question.id)})

    # --- written: correct ------------------------------------------------
    def test_written_equivalent_answer_is_correct_and_awards_xp(self):
        question = self._written_question(correct_answer='2*x')
        session, response = self._session_with(question)

        res = self.client.patch(self._url(session, question), {'written_answer': 'x+x'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_correct'])
        self.assertEqual(res.data['written_answer'], 'x+x')
        self.assertEqual(res.data['correct_answer'], '2*x')  # revealed post-submit

        response.refresh_from_db()
        self.assertTrue(response.is_correct)
        self.assertIsNotNone(response.answered_at)
        session.refresh_from_db()
        self.assertEqual(session.total_xp_earned, XP_PER_CORRECT_ANSWER)

    # --- written: incorrect ---------------------------------------------
    def test_written_wrong_answer_is_incorrect_no_xp(self):
        question = self._written_question(correct_answer='2*x')
        session, response = self._session_with(question)

        res = self.client.patch(self._url(session, question), {'written_answer': 'x'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_correct'])
        response.refresh_from_db()
        self.assertIsNotNone(response.answered_at)
        session.refresh_from_db()
        self.assertEqual(session.total_xp_earned, 0)

    # --- written: invalid -> 422, not finalized -------------------------
    def test_unparseable_answer_returns_422_and_does_not_finalize(self):
        question = self._written_question(correct_answer='2*x')
        session, response = self._session_with(question)

        res = self.client.patch(self._url(session, question), {'written_answer': '2x+'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(res.data['status'], 'invalid')

        # Nothing recorded: the learner can resubmit.
        response.refresh_from_db()
        self.assertIsNone(response.answered_at)
        self.assertFalse(response.is_correct)
        self.assertEqual(response.written_answer, '')

        # And resubmitting a valid answer now succeeds.
        res2 = self.client.patch(self._url(session, question), {'written_answer': 'x+x'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data['is_correct'])

    # --- written: already answered --------------------------------------
    def test_resubmitting_answered_question_returns_400(self):
        question = self._written_question(correct_answer='2*x')
        session, question_response = self._session_with(question)

        self.client.patch(self._url(session, question), {'written_answer': 'x+x'}, format='json')
        res = self.client.patch(self._url(session, question), {'written_answer': 'x+x'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # --- written: missing payload ---------------------------------------
    def test_written_requires_written_answer(self):
        question = self._written_question()
        session, _ = self._session_with(question)

        res = self.client.patch(self._url(session, question), {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # --- MCQ regression --------------------------------------------------
    def test_mcq_path_still_works(self):
        question = self._mcq_question()
        session, response = self._session_with(question)

        res = self.client.patch(self._url(session, question), {'selected_answer_index': 1}, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_correct'])
        self.assertEqual(res.data['correct_answer_index'], 1)
        response.refresh_from_db()
        self.assertIsNotNone(response.answered_at)
