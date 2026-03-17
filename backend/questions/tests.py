from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from questions.models import Topic, Question, TopicMastery, Student, PracticeSession, SingleQuestionInteraction
from questions.fsrs_engine import update_stability
from django.utils import timezone
from datetime import datetime

User = get_user_model()

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'

    def test_register(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
        self.assertTrue(Student.objects.filter(user__email='test@example.com').exists())

class FSRSTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_update_stability(self):
        # Test initial update
        stab, diff = update_stability(0, 5.0, None, 3) # Good
        self.assertGreater(stab, 0)

    def test_session_lifecycle(self):
        # Create user and student
        user = User.objects.create_user(username='student', email='s@e.com', password='p')
        student = Student.objects.create(user=user)
        self.client.force_authenticate(user=user)

        # Create topic and question
        topic = Topic.objects.create(name='Math')
        question = Question.objects.create(topic=topic, text='Q1', correct_answer_index=0, tier=1)

        # Create session with interaction
        session_data = {
            'session_type': 'adaptive',
            'interactions': [
                {
                    'question': question.id,
                    'user_response': '0', # Correct index as string
                    'confidence_rating': 4, # Easy
                    'time_taken_seconds': 15.0
                }
            ]
        }

        url = '/api/v1/sessions/'
        response = self.client.post(url, session_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify student XP and streak
        student.refresh_from_db()
        self.assertEqual(student.streak_count, 1)
        self.assertGreater(student.total_xp, 0)

        # Verify TopicMastery
        mastery = TopicMastery.objects.get(student=student, topic=topic)
        self.assertGreater(mastery.stability, 0)
        self.assertIsNotNone(mastery.next_review_date)

    def test_generate_adaptive_session(self):
        user = User.objects.create_user(username='student2', email='s2@e.com', password='p')
        student = Student.objects.create(user=user)
        self.client.force_authenticate(user=user)

        topic = Topic.objects.create(name='Logic')
        Question.objects.create(topic=topic, text='Q1', correct_answer_index=0, tier=1)
        
        # Manually create a due mastery
        from django.utils import timezone
        from datetime import timedelta
        TopicMastery.objects.create(
            student=student, 
            topic=topic, 
            next_review_date=timezone.now() - timedelta(days=1),
            stability=1.0,
            difficulty=5.0
        )

        url = '/api/v1/sessions/generate-adaptive/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['topic'], 'Logic')
        self.assertGreater(len(response.data['questions']), 0)
