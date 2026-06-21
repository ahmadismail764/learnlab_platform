import uuid

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, APIClient, force_authenticate
from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.constants import XP_PER_CORRECT_ANSWER
from practice.models import Question, PracticeSession, QuestionResponse
from practice.views import PracticeSessionViewSet
from topics.views import SubtopicMasteryViewSet


class ViewSetGetQuerysetTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

        self.staff_user = User.objects.create_user(
            username='staff_user',
            email='staff@example.com',
            password='password123',
            is_staff=True
        )
        self.learner_user_1 = User.objects.create_user(
            username='learner_1',
            email='learner1@example.com',
            password='password123'
        )
        self.learner_user_2 = User.objects.create_user(
            username='learner_2',
            email='learner2@example.com',
            password='password123'
        )

        self.topic = Topic.objects.create(name='Math', description='Math Topic')
        self.subtopic = Subtopic.objects.create(topic=self.topic, name='Algebra', description='Algebra Subtopic')

        self.question = Question.objects.create(
            subtopic=self.subtopic,
            tier=1,
            text='What is 2+2?',
            choices=['3', '4', '5'],
            correct_answer_index=1
        )

        self.session_user_1 = PracticeSession.objects.create(learner=self.learner_user_1)
        self.session_user_2 = PracticeSession.objects.create(learner=self.learner_user_2)

        QuestionResponse.objects.create(session=self.session_user_1, question=self.question, is_correct=True)
        QuestionResponse.objects.create(session=self.session_user_2, question=self.question, is_correct=False)

        self.mastery_user_1 = SubtopicMastery.objects.create(
            learner=self.learner_user_1, subtopic=self.subtopic,
            difficulty=5.0, stability=1.0, reps=1, lapses=0, state='NEW'
        )
        self.mastery_user_2 = SubtopicMastery.objects.create(
            learner=self.learner_user_2, subtopic=self.subtopic,
            difficulty=4.5, stability=1.2, reps=2, lapses=1, state='LEARNING'
        )

    def test_practice_session_viewset_queryset(self):
        view = PracticeSessionViewSet.as_view({'get': 'list'})

        request = self.factory.get('/practice/sessions/')
        force_authenticate(request, user=self.staff_user)
        response = view(request)
        self.assertEqual(len(response.data), 2)

        request = self.factory.get('/practice/sessions/')
        force_authenticate(request, user=self.learner_user_1)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.session_user_1.id))

        request = self.factory.get('/practice/sessions/')
        force_authenticate(request, user=self.learner_user_2)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.session_user_2.id))

    def test_subtopic_mastery_viewset_queryset(self):
        view = SubtopicMasteryViewSet.as_view({'get': 'list'})

        request = self.factory.get('/topics/mastery/')
        force_authenticate(request, user=self.staff_user)
        response = view(request)
        self.assertEqual(len(response.data), 2)

        request = self.factory.get('/topics/mastery/')
        force_authenticate(request, user=self.learner_user_1)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.mastery_user_1.id))


class PracticeSessionContractTestCase(TestCase):
    """
    Tests for the placeholder-based practice session contract:
      POST   /api/v1/practice/sessions/                                        — create session + seed placeholders
      PATCH  /api/v1/practice/sessions/{session_id}/responses/{question_id}/  — submit answer
    """

    def setUp(self):
        self.client = APIClient()
        self.learner = User.objects.create_user(
            username='learner_contract',
            email='contract@example.com',
            password='pass123',
        )
        self.other_learner = User.objects.create_user(
            username='other_contract',
            email='other_contract@example.com',
            password='pass123',
        )
        topic = Topic.objects.create(name='Science', description='Science')
        subtopic = Subtopic.objects.create(topic=topic, name='Physics', description='Physics')
        self.question = Question.objects.create(
            subtopic=subtopic,
            tier=1,
            text='What is gravity?',
            choices=['A force', 'A wave', 'A particle', 'An atom'],
            correct_answer_index=0,
        )
        # Manually seed a session and placeholder — mirrors what POST /sessions/ does internally.
        self.session = PracticeSession.objects.create(learner=self.learner)
        self.placeholder = QuestionResponse.objects.create(
            session=self.session,
            question=self.question,
            selected_answer_index=None,
            is_correct=False,
        )
        self.client.force_authenticate(user=self.learner)

    def _patch_url(self, question_id=None):
        qid = question_id or self.question.id
        return f'/api/v1/practice/sessions/{self.session.id}/responses/{qid}/'

    def test_correct_submission_returns_feedback_with_reveal(self):
        resp = self.client.patch(self._patch_url(), {'selected_answer_index': 0}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertIn('is_correct', data)
        self.assertIn('correct_answer_index', data)
        self.assertIn('selected_answer_index', data)
        self.assertTrue(data['is_correct'])
        self.assertEqual(data['correct_answer_index'], 0)
        self.assertEqual(data['selected_answer_index'], 0)

        self.placeholder.refresh_from_db()
        self.assertEqual(self.placeholder.selected_answer_index, 0)
        self.assertTrue(self.placeholder.is_correct)

        self.session.refresh_from_db()
        self.assertEqual(self.session.total_xp_earned, XP_PER_CORRECT_ANSWER)

    def test_incorrect_submission_reveals_correct_answer(self):
        resp = self.client.patch(self._patch_url(), {'selected_answer_index': 2}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertFalse(data['is_correct'])
        self.assertEqual(data['selected_answer_index'], 2)
        self.assertEqual(data['correct_answer_index'], 0)

        self.placeholder.refresh_from_db()
        self.assertEqual(self.placeholder.selected_answer_index, 2)
        self.assertFalse(self.placeholder.is_correct)

        self.session.refresh_from_db()
        self.assertEqual(self.session.total_xp_earned, 0)

    def test_resubmission_prevented(self):
        self.client.patch(self._patch_url(), {'selected_answer_index': 0}, format='json')
        resp = self.client.patch(self._patch_url(), {'selected_answer_index': 1}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been answered', resp.data['detail'])

    def test_other_learner_cannot_submit(self):
        self.client.force_authenticate(user=self.other_learner)
        resp = self.client.patch(self._patch_url(), {'selected_answer_index': 0}, format='json')
        # Session is hidden from other learners via queryset isolation (404 before ownership check).
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_question_placeholder_returns_404(self):
        resp = self.client.patch(
            f'/api/v1/practice/sessions/{self.session.id}/responses/{uuid.uuid4()}/',
            {'selected_answer_index': 0},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_xp_awarded_on_correct_answer(self):
        self.session.total_xp_earned = 0
        self.session.save()
        self.client.patch(self._patch_url(), {'selected_answer_index': 0}, format='json')
        self.session.refresh_from_db()
        self.assertGreater(self.session.total_xp_earned, 0)

    def test_submit_invalid_body_rejected(self):
        missing = self.client.patch(self._patch_url(), {}, format='json')
        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)

        negative = self.client.patch(self._patch_url(), {'selected_answer_index': -1}, format='json')
        self.assertEqual(negative.status_code, status.HTTP_400_BAD_REQUEST)


class SessionCreatePlaceholderTestCase(TestCase):
    """Tests for POST /api/v1/practice/sessions/ placeholder seeding."""

    def setUp(self):
        self.client = APIClient()
        self.learner = User.objects.create_user(
            username='learner_create',
            email='create@example.com',
            password='pass123',
        )
        self.client.force_authenticate(user=self.learner)

        self.topic_a = Topic.objects.create(name='Topic A', description='A')
        self.topic_b = Topic.objects.create(name='Topic B', description='B')
        self.subtopic_a = Subtopic.objects.create(
            topic=self.topic_a, name='Sub A', description='Sub A',
        )
        self.subtopic_b = Subtopic.objects.create(
            topic=self.topic_b, name='Sub B', description='Sub B',
        )
        self.questions_a = [
            Question.objects.create(
                subtopic=self.subtopic_a,
                tier=1,
                text=f'Question A{i}',
                choices=['A', 'B', 'C', 'D'],
                correct_answer_index=0,
            )
            for i in range(3)
        ]
        self.questions_b = [
            Question.objects.create(
                subtopic=self.subtopic_b,
                tier=1,
                text=f'Question B{i}',
                choices=['A', 'B', 'C', 'D'],
                correct_answer_index=1,
            )
            for i in range(2)
        ]

    def _create_url(self, **query_params):
        url = '/api/v1/practice/sessions/'
        if query_params:
            params = '&'.join(f'{k}={v}' for k, v in query_params.items())
            url = f'{url}?{params}'
        return url

    def test_create_session_returns_placeholders(self):
        resp = self.client.post(self._create_url(), {'responses': []}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('responses', resp.data)
        self.assertGreater(len(resp.data['responses']), 0)
        self.assertLessEqual(len(resp.data['responses']), 10)
        for item in resp.data['responses']:
            self.assertIn('id', item)
            self.assertIn('question', item)

    def test_created_placeholders_are_unanswered_in_db(self):
        resp = self.client.post(self._create_url(), {'responses': []}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        for item in resp.data['responses']:
            db_row = QuestionResponse.objects.get(id=item['id'])
            self.assertIsNone(db_row.selected_answer_index)

    def test_create_respects_limit_query_param(self):
        resp = self.client.post(self._create_url(limit=2), {'responses': []}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertLessEqual(len(resp.data['responses']), 2)

    def test_create_with_topic_filter(self):
        resp = self.client.post(
            self._create_url(topic=self.topic_a.id),
            {'responses': []},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertGreater(len(resp.data['responses']), 0)

        topic_a_question_ids = {str(q.id) for q in self.questions_a}
        for item in resp.data['responses']:
            self.assertIn(str(item['question']), topic_a_question_ids)
