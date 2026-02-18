from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from questions.models import Topic, Question, TopicMastery, Student, PracticeSheet
from questions.fsrs_engine import update_stability
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
        stab, diff = update_stability(0, 0, None, 3) # Good
        self.assertGreater(stab, 0)
        # Difficulty might be 0 or calculated? FSRS handles it.
        # But stability should be updated.

    def test_submission_logic(self):
        # Create user and student
        user = User.objects.create_user(username='student', email='s@e.com', password='p')
        # Student profile is created by signals usually, or manually in my register view.
        # Since I'm creating user directly, I must create student manually as signals are not set up for this yet (RegisterView handles it).
        student = Student.objects.create(user=user)
        self.client.force_authenticate(user=user)

        # Create topic and question
        topic = Topic.objects.create(name='Math')
        question = Question.objects.create(topic=topic, text='Q1', correct_answer_index=0, tier=1)

        # Create sheet
        sheet = PracticeSheet.objects.create(total_xp=10)
        sheet.questions.add(question)

        submission_data = {
            'sheet': sheet.id,
            'time_taken': '00:01:00',
            'answers': [
                {
                    'question': question.id,
                    'selected_answer_index': 0, # Correct
                    'confidence': 0.9 # Easy
                }
            ]
        }

        url = '/api/v1/submissions/'
        response = self.client.post(url, submission_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify student XP and streak
        student.refresh_from_db()
        self.assertEqual(student.streak_count, 1)
        self.assertGreater(student.xp, 0)

        # Verify TopicMastery
        mastery = TopicMastery.objects.get(student=student, topic=topic)
        self.assertGreater(mastery.stability, 0)
