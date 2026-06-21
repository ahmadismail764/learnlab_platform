from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery


class TopicsPermissionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.learner = User.objects.create_user(username='l1', email='l1@x.com', password='pass123')
        self.staff = User.objects.create_user(username='s1', email='s1@x.com', password='pass123', is_staff=True)
        self.topic = Topic.objects.create(name='Math', description='Math')
        self.subtopic = Subtopic.objects.create(topic=self.topic, name='Algebra', description='Algebra')
        self.mastery = SubtopicMastery.objects.create(learner=self.learner, subtopic=self.subtopic)

    def test_learner_cannot_create_topic(self):
        self.client.force_authenticate(user=self.learner)
        resp = self.client.post('/api/v1/topics/', {'name': 'X', 'description': ''})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_create_topic(self):
        self.client.force_authenticate(user=self.staff)
        resp = self.client.post('/api/v1/topics/', {'name': 'X', 'description': ''})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_learner_cannot_create_subtopic(self):
        self.client.force_authenticate(user=self.learner)
        resp = self.client.post('/api/v1/subtopics/', {'topic': str(self.topic.id), 'name': 'X', 'description': ''})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_mastery_create_blocked_for_everyone(self):
        self.client.force_authenticate(user=self.learner)
        resp = self.client.post('/api/v1/mastery/', {'subtopic': str(self.subtopic.id)})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_mastery_update_blocked_for_staff_too(self):
        self.client.force_authenticate(user=self.staff)
        resp = self.client.patch(f'/api/v1/mastery/{self.mastery.id}/', {'state': 'REVIEW'})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_learner_sees_only_own_mastery(self):
        other = User.objects.create_user(username='l2', email='l2@x.com', password='pass123')
        SubtopicMastery.objects.create(learner=other, subtopic=self.subtopic)
        self.client.force_authenticate(user=self.learner)
        resp = self.client.get('/api/v1/mastery/')
        self.assertEqual(len(resp.data), 1)