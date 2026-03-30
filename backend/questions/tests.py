"""
questions/tests.py
Basic test suite to secure FSRS features and the adaptive practice session endpoint.
"""

from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import Student
from questions.models import Question, Topic, TopicMastery
from questions.fsrs_engine import process_topic_review

User = get_user_model()

class FSRSEngineTests(APITestCase):
    """
    Unit tests for the FSRS scheduling engine utility functions.
    """
    def test_process_topic_review_easy(self):
        """
        Test the process_topic_review function with a rating of 4 (Easy).
        It creates a dummy student and topic, constructs a TopicMastery,
        then evaluates that reps increase, stability grows, and next_review_date is populated.
        """
        # Create dummy user and student
        user = User.objects.create_user(username='teststudent', email='test@example.com', password='password123')
        student = Student.objects.create(user=user)
        
        # Create a dummy topic
        topic = Topic.objects.create(name='Mathematics')
        
        # Create a TopicMastery for the student and topic
        mastery = TopicMastery.objects.create(student=student, topic=topic)
        
        # Capture initial state metrics
        initial_reps = mastery.reps
        initial_stability = mastery.stability
        self.assertIsNone(mastery.next_review_date, "New mastery should lack a next_review_date.")
        
        # Pass the mastery to the engine with a rating of 4 (Easy)
        process_topic_review(mastery, rating=4)
        
        # Reload from the database to get actual saved values instead of in-memory approximations
        mastery.refresh_from_db()
        
        # Assert that repetition count increased
        self.assertGreater(mastery.reps, initial_reps, "Reps should increase after a review.")
        
        # Assert that stability increased (FSRS adjusts stability dynamically)
        self.assertGreater(mastery.stability, initial_stability, "Stability should increase on an Easy rating.")
        
        # Assert that next_review_date is no longer None
        self.assertIsNotNone(mastery.next_review_date, "Next review date must be scheduled after a review.")


class PracticeSessionAPITests(APITestCase):
    """
    API tests for the practice session endpoints.
    """
    def test_generate_adaptive_endpoint(self):
        """
        Test the adaptive generation endpoint. It creates an authenticated student,
        calls GET /api/questions/practice-sessions/generate-adaptive/,
        and asserts the response status corresponds to 200 OK.
        We also ensure that it returns the expected JSON structure containing
        the nested attributes like topic, tier, and the main key questions.
        """
        # Create authenticated student for our API call
        user = User.objects.create_user(username='apitest', email='api@example.com', password='password123')
        student = Student.objects.create(user=user)
        
        # Force authentication so the API test bypasses standard login flows 
        self.client.force_authenticate(user=user)
        
        # Provide base requirements for the generation to work
        # Create dummy topics
        math_topic = Topic.objects.create(name='Calculus')
        
        # Create dummy question under this topic to be retrieved by the endpoint
        Question.objects.create(
            topic=math_topic,
            text='What is the derivative of x^2?',
            choices=['2x', 'x^2', '2', 'x'],
            correct_answer_index=0,
            tier=2, # Synthesis/Application level
            explanation_video_url='http://example.com'
        )

        # Ensure the math_topic is 'due' by backdating a mastery
        TopicMastery.objects.create(
            student=student,
            topic=math_topic,
            next_review_date=timezone.now() - timedelta(days=1)
        )
        
        # Call GET /api/questions/practice-sessions/generate-adaptive/
        # Since we use router structure we can directly use the explicit path string as required
        response = self.client.get('/api/questions/practice-sessions/generate-adaptive/')
        
        # Assert the response status is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK, "Adapter generation should return a 200 success code.")
        
        # Validate that the top level 'questions' key is present
        self.assertIn('questions', response.data, "Response should have the 'questions' key.")
        
        # Obtain the array/list of returned questions
        questions = response.data['questions']
        self.assertIsInstance(questions, list, "Expected 'questions' to be a valid JSON array/list.")
        self.assertGreater(len(questions), 0, "Expected to retrieve at least one question for the due mastery topics.")
        
        first_question = questions[0]
        
        # Assert the returned question structure contains expected attributes (topic, tier)
        self.assertIn('topic', first_question, "Each question must contain its assigned topic.")
        self.assertIn('tier', first_question, "Each question must report its difficulty tier.")
