from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.models import Question, PracticeSession, QuestionResponse
from practice.views import PracticeSessionViewSet, QuestionResponseViewSet
from topics.views import SubtopicMasteryViewSet

class ViewSetGetQuerysetTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

        # Create users
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

        # Create topic and subtopic
        self.topic = Topic.objects.create(name='Math', description='Math Topic')
        self.subtopic = Subtopic.objects.create(topic=self.topic, name='Algebra', description='Algebra Subtopic')

        # Create question
        self.question = Question.objects.create(
            subtopic=self.subtopic,
            tier=1,
            text='What is 2+2?',
            choices=['3', '4', '5'],
            correct_answer_index=1
        )

        # Create practice sessions
        self.session_user_1 = PracticeSession.objects.create(
            learner=self.learner_user_1
        )
        self.session_user_2 = PracticeSession.objects.create(
            learner=self.learner_user_2
        )

        # Create question responses
        self.response_user_1 = QuestionResponse.objects.create(
            session=self.session_user_1,
            question=self.question,
            is_correct=True
        )
        self.response_user_2 = QuestionResponse.objects.create(
            session=self.session_user_2,
            question=self.question,
            is_correct=False
        )

        # Create subtopic masteries
        self.mastery_user_1 = SubtopicMastery.objects.create(
            learner=self.learner_user_1,
            subtopic=self.subtopic,
            difficulty=5.0,
            stability=1.0,
            reps=1,
            lapses=0,
            state='NEW'
        )
        self.mastery_user_2 = SubtopicMastery.objects.create(
            learner=self.learner_user_2,
            subtopic=self.subtopic,
            difficulty=4.5,
            stability=1.2,
            reps=2,
            lapses=1,
            state='LEARNING'
        )

    def test_practice_session_viewset_queryset(self):
        view = PracticeSessionViewSet.as_view({'get': 'list'})

        # 1. Staff user should see all sessions
        request = self.factory.get('/practice/sessions/')
        force_authenticate(request, user=self.staff_user)
        response = view(request)
        self.assertEqual(len(response.data), 2)

        # 2. Learner 1 should only see their own sessions
        request = self.factory.get('/practice/sessions/')
        force_authenticate(request, user=self.learner_user_1)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.session_user_1.id))

        # 3. Learner 2 should only see their own sessions
        request = self.factory.get('/practice/sessions/')
        force_authenticate(request, user=self.learner_user_2)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.session_user_2.id))

    def test_question_response_viewset_queryset(self):
        view = QuestionResponseViewSet.as_view({'get': 'list'})

        # 1. Staff user should see all question responses
        request = self.factory.get('/practice/responses/')
        force_authenticate(request, user=self.staff_user)
        response = view(request)
        self.assertEqual(len(response.data), 2)

        # 2. Learner 1 should only see their own question responses
        request = self.factory.get('/practice/responses/')
        force_authenticate(request, user=self.learner_user_1)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.response_user_1.id))

    def test_subtopic_mastery_viewset_queryset(self):
        view = SubtopicMasteryViewSet.as_view({'get': 'list'})

        # 1. Staff user should see all subtopic masteries
        request = self.factory.get('/topics/mastery/')
        force_authenticate(request, user=self.staff_user)
        response = view(request)
        self.assertEqual(len(response.data), 2)

        # 2. Learner 1 should only see their own subtopic masteries
        request = self.factory.get('/topics/mastery/')
        force_authenticate(request, user=self.learner_user_1)
        response = view(request)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.mastery_user_1.id))
