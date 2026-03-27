from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student
from questions.models import Topic, Question

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with test data (topics, questions, and a test student) for development'

    def handle(self, *args, **kwargs):
        # 1. Create or get user and student
        user, user_created = User.objects.get_or_create(
            username='teststudent',
            defaults={
                'email': 'teststudent@example.com'
            }
        )
        if user_created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created User: teststudent'))
        else:
            self.stdout.write('User teststudent already exists.')

        student, student_created = Student.objects.get_or_create(user=user)
        if student_created:
            self.stdout.write(self.style.SUCCESS('Created Student profile for teststudent'))
            
        # 2. Create topics
        discrete_math, dm_created = Topic.objects.get_or_create(
            name='Discrete Mathematics',
            defaults={'description': 'Foundations of mathematical logic and structures.'}
        )
        if dm_created:
            self.stdout.write(self.style.SUCCESS('Created Topic: Discrete Mathematics'))

        python_basics, pb_created = Topic.objects.get_or_create(
            name='Python Basics',
            defaults={'description': 'Core concepts of Python programming.'}
        )
        if pb_created:
            self.stdout.write(self.style.SUCCESS('Created Topic: Python Basics'))

        # 3. Create questions for Discrete Math
        dm_questions = [
            # Tier 1
            {'text': 'Which of the following represents a logical AND operation?', 'choices': ['^', 'v', '!', '->'], 'correct_index': 0, 'tier': 1},
            {'text': 'What is a set with no elements called?', 'choices': ['Empty set', 'Universal set', 'Subset', 'Power set'], 'correct_index': 0, 'tier': 1},
            # Tier 2
            {'text': 'If P is True and Q is False, what is P OR Q?', 'choices': ['True', 'False', 'Undefined', 'Both'], 'correct_index': 0, 'tier': 2},
            {'text': 'Which formula represents the number of subsets for a set of size n?', 'choices': ['2^n', 'n^2', 'n!', '2n'], 'correct_index': 0, 'tier': 2},
            # Tier 3
            {'text': 'Write out the base case for mathematical induction for sum of first n positive integers.', 'choices': ['n=1', 'n=0', 'n=2', 'None'], 'correct_index': 0, 'tier': 3},
            {'text': 'Construct a truth table for ~(P v Q). Which of the following is logically equivalent?', 'choices': ['~P ^ ~Q', '~P v ~Q', 'P ^ Q', 'P v Q'], 'correct_index': 0, 'tier': 3},
        ]

        # 4. Create questions for Python Basics
        pb_questions = [
            # Tier 1
            {'text': 'How do you create a list in Python?', 'choices': ['[]', '{}', '()', '<>'], 'correct_index': 0, 'tier': 1},
            {'text': 'What keyword defines a function?', 'choices': ['def', 'func', 'function', 'define'], 'correct_index': 0, 'tier': 1},
            # Tier 2
            {'text': 'What is the output of 3 // 2?', 'choices': ['1', '1.5', '2', '0'], 'correct_index': 0, 'tier': 2},
            {'text': 'How do you iterate over a dictionary to get both keys and values?', 'choices': ['for k, v in dict.items():', 'for item in dict:', 'for k in dict.keys:', 'iterate dict:'], 'correct_index': 0, 'tier': 2},
            # Tier 3
            {'text': 'Provide a list comprehension to get squares of evens from 1 to 10.', 'choices': ['[x**2 for x in range(1, 11) if x % 2 == 0]', '[x^2 for x in range(10) if x%2==0]', '[x*2 for x in list if even]', 'None'], 'correct_index': 0, 'tier': 3},
            {'text': 'Explain the difference between deepcopy and shallow copy in Python conceptually.', 'choices': ['Deepcopy copies nested objects recursively', 'They are the exact same', 'Shallow copy copies nested objects recursively', 'None'], 'correct_index': 0, 'tier': 3},
        ]

        # Helper function to safely create questions
        def create_q(topic, qd):
            # Use text as the unique identifier for the question to avoid duplicates 
            q, created = Question.objects.get_or_create(
                topic=topic,
                text=qd['text'],
                defaults={
                    'choices': qd['choices'],
                    'correct_answer_index': qd['correct_index'],
                    'tier': qd['tier']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Question for {topic.name} (Tier {qd['tier']})"))

        for qd in dm_questions:
            create_q(discrete_math, qd)

        for qd in pb_questions:
            create_q(python_basics, qd)

        self.stdout.write(self.style.SUCCESS('\nSuccessfully seeded development data!'))
