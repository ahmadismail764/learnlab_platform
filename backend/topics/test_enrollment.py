"""Tests for the Subtopic Enrollment feature (existence-based).

Enrollment is modeled by the *existence* of a ``SubtopicMastery`` row for a
(learner, subtopic) pair — there is no separate table and no status field.
These tests cover the two guarantees that live at this layer:
  * Strict isolation — questions and sessions never cross enrollment boundaries.
  * Data integrity  — one row per (learner, subtopic); enroll creates it,
                       unenroll deletes it.
(FSRS-5 math compliance is covered in practice/test_fsrs_engine.)
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.models import Question, PracticeSession


def enroll(learner, subtopic):
    """Test helper: enrolling == creating the mastery row."""
    return SubtopicMastery.objects.create(learner=learner, subtopic=subtopic)


class EnrollmentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.learner = User.objects.create_user(username='l1', email='l1@x.com', password='pw')
        self.other = User.objects.create_user(username='l2', email='l2@x.com', password='pw')
        self.staff = User.objects.create_user(username='s1', email='s1@x.com', password='pw', is_staff=True)
        self.topic = Topic.objects.create(name='Discrete Math')
        self.subtopic = Subtopic.objects.create(topic=self.topic, name='Sets')

    def test_enroll_creates_mastery_201(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.post('/api/v1/enrollments/', {'subtopic': str(self.subtopic.id)})

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['mastery_state'], 'NEW')
        self.assertTrue(
            SubtopicMastery.objects.filter(learner=self.learner, subtopic=self.subtopic).exists()
        )

    def test_reenroll_returns_200_and_preserves_state(self):
        self.client.force_authenticate(self.learner)
        m = enroll(self.learner, self.subtopic)
        m.reps = 7
        m.state = SubtopicMastery.StateChoices.REVIEW
        m.save()

        resp = self.client.post('/api/v1/enrollments/', {'subtopic': str(self.subtopic.id)})

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(SubtopicMastery.objects.filter(learner=self.learner).count(), 1)
        m.refresh_from_db()
        # Re-enrolling must NOT reset accumulated FSRS state.
        self.assertEqual(m.reps, 7)
        self.assertEqual(m.state, SubtopicMastery.StateChoices.REVIEW)

    def test_unenroll_deletes_mastery_204(self):
        self.client.force_authenticate(self.learner)
        m = enroll(self.learner, self.subtopic)
        resp = self.client.delete(f'/api/v1/enrollments/{m.id}/')

        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SubtopicMastery.objects.filter(id=m.id).exists())

    def test_patch_not_allowed(self):
        self.client.force_authenticate(self.learner)
        m = enroll(self.learner, self.subtopic)
        resp = self.client.patch(f'/api/v1/enrollments/{m.id}/', {'x': 1}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_learner_cannot_unenroll_others(self):
        others_mastery = enroll(self.other, self.subtopic)
        self.client.force_authenticate(self.learner)
        resp = self.client.delete(f'/api/v1/enrollments/{others_mastery.id}/')
        # Scoped queryset hides it → 404, and the row survives.
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(SubtopicMastery.objects.filter(id=others_mastery.id).exists())

    def test_learner_sees_only_own_enrollments(self):
        enroll(self.learner, self.subtopic)
        enroll(self.other, self.subtopic)
        self.client.force_authenticate(self.learner)
        resp = self.client.get('/api/v1/enrollments/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_enrollment_requires_auth(self):
        resp = self.client.post('/api/v1/enrollments/', {'subtopic': str(self.subtopic.id)})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_enroll_unknown_subtopic_400(self):
        import uuid
        self.client.force_authenticate(self.learner)
        resp = self.client.post('/api/v1/enrollments/', {'subtopic': str(uuid.uuid4())})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class QuestionIsolationTests(TestCase):
    """Strict Isolation: question access is gated by mastery existence."""

    def setUp(self):
        self.client = APIClient()
        self.learner = User.objects.create_user(username='l1', email='l1@x.com', password='pw')
        self.staff = User.objects.create_user(username='s1', email='s1@x.com', password='pw', is_staff=True)
        self.topic = Topic.objects.create(name='Discrete Math')
        self.sub_a = Subtopic.objects.create(topic=self.topic, name='Sets')
        self.sub_b = Subtopic.objects.create(topic=self.topic, name='Logic')
        self.q_a = Question.objects.create(
            subtopic=self.sub_a, tier=1, text='A?', choices=['1', '2'], correct_answer_index=0
        )
        self.q_b = Question.objects.create(
            subtopic=self.sub_b, tier=1, text='B?', choices=['1', '2'], correct_answer_index=1
        )
        enroll(self.learner, self.sub_a)  # enrolled only in A

    def test_list_excludes_unenrolled(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.get('/api/v1/practice/questions/')
        returned_ids = {q['id'] for q in resp.data}
        self.assertIn(str(self.q_a.id), returned_ids)
        self.assertNotIn(str(self.q_b.id), returned_ids)

    def test_retrieve_unenrolled_returns_404(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.get(f'/api/v1/practice/questions/{self.q_b.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_unenroll_hides_questions(self):
        SubtopicMastery.objects.filter(learner=self.learner, subtopic=self.sub_a).delete()
        self.client.force_authenticate(self.learner)
        resp = self.client.get('/api/v1/practice/questions/')
        self.assertEqual(len(resp.data), 0)

    def test_staff_sees_all_questions(self):
        self.client.force_authenticate(self.staff)
        resp = self.client.get('/api/v1/practice/questions/')
        returned_ids = {q['id'] for q in resp.data}
        self.assertIn(str(self.q_a.id), returned_ids)
        self.assertIn(str(self.q_b.id), returned_ids)


class SessionFilteringTests(TestCase):
    """Localized session sourcing: sessions only draw from enrolled subtopics."""

    def setUp(self):
        self.client = APIClient()
        self.learner = User.objects.create_user(username='l1', email='l1@x.com', password='pw')
        self.topic = Topic.objects.create(name='Discrete Math')
        self.sub_a = Subtopic.objects.create(topic=self.topic, name='Sets')
        self.sub_b = Subtopic.objects.create(topic=self.topic, name='Logic')
        for i in range(5):
            Question.objects.create(
                subtopic=self.sub_a, tier=1, text=f'A{i}', choices=['1', '2'], correct_answer_index=0
            )
            Question.objects.create(
                subtopic=self.sub_b, tier=1, text=f'B{i}', choices=['1', '2'], correct_answer_index=1
            )
        enroll(self.learner, self.sub_a)

    def test_session_only_pulls_enrolled_questions(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.post('/api/v1/practice/sessions/?limit=10')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        session = PracticeSession.objects.get(id=resp.data['id'])
        subtopics = {
            r.question.subtopic_id
            for r in session.responses.select_related('question').all()
        }
        # Fallback must stay inside the enrolled pool — never subtopic B.
        self.assertEqual(subtopics, {self.sub_a.id})
        self.assertEqual(session.responses.count(), 5)

    def test_session_unenrolled_subtopic_param_403(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.post(f'/api/v1/practice/sessions/?subtopic={self.sub_b.id}')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_session_enrolled_subtopic_param_ok(self):
        self.client.force_authenticate(self.learner)
        resp = self.client.post(f'/api/v1/practice/sessions/?subtopic={self.sub_a.id}')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_session_with_no_enrollment_is_empty(self):
        loner = User.objects.create_user(username='l9', email='l9@x.com', password='pw')
        self.client.force_authenticate(loner)
        resp = self.client.post('/api/v1/practice/sessions/?limit=10')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resp.data['responses']), 0)
