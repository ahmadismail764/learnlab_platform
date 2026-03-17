from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Student
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class UserModelTests(TestCase):
    def test_create_user_with_role(self):
        user = User.objects.create_user(username='admin_user', email='a@e.com', password='p', role='admin')
        self.assertEqual(user.role, 'admin')
        self.assertFalse(user.is_locked())

    def test_user_locking(self):
        user = User.objects.create_user(username='locked_user', email='l@e.com', password='p')
        user.account_locked_until = timezone.now() + timedelta(hours=1)
        user.save()
        self.assertTrue(user.is_locked())

class LeaderboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='u1', email='u1@e.com', password='p')
        self.s1 = Student.objects.create(user=self.user1, total_xp=100)
        
        self.user2 = User.objects.create_user(username='u2', email='u2@e.com', password='p')
        self.s2 = Student.objects.create(user=self.user2, total_xp=200)

    def test_leaderboard_ordering(self):
        self.client.force_authenticate(user=self.user1)
        url = '/api/v1/leaderboard/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # u2 should be first (200 XP)
        self.assertEqual(response.data['results'][0]['user']['username'], 'u2')
