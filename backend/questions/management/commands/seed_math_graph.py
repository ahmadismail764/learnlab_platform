from django.core.management.base import BaseCommand
from questions.models import Topic, KnowledgePoint, Question
import json

class Command(BaseCommand):
    help = 'Seeds the database with a test Knowledge Graph (Basic Addition -> Multiplication -> Exponents)'

    def handle(self, *args, **options):
        self.stdout.write("Clearing existing Topic, KnowledgePoint, and Question data...")
        Topic.objects.all().delete()
        KnowledgePoint.objects.all().delete()
        Question.objects.all().delete()

        self.stdout.write("Creating Topics...")
        addition = Topic.objects.create(name='Basic Addition', description='Understanding basic addition')
        multiplication = Topic.objects.create(name='Multiplication', description='Understanding multiplication')
        exponents = Topic.objects.create(name='Exponents', description='Understanding exponents')

        self.stdout.write("Establishing DAG prerequisites...")
        # Addition is prerequisite for Multiplication
        multiplication.prerequisites.add(addition)
        # Multiplication is prerequisite for Exponents
        exponents.prerequisites.add(multiplication)

        self.stdout.write("Establishing Encompassings...")
        # Exponents encompasses Multiplication and Addition
        exponents.encompassings.add(multiplication, addition)

        self.stdout.write("Creating KnowledgePoints...")
        kp_addition = KnowledgePoint.objects.create(topic=addition, name='Single Digit Addition')
        kp_multiplication = KnowledgePoint.objects.create(topic=multiplication, name='Times Tables')
        kp_exponents = KnowledgePoint.objects.create(topic=exponents, name='Basic Squaring')

        self.stdout.write("Creating Questions...")
        
        # Addition Questions
        Question.objects.create(
            knowledge_point=kp_addition,
            text="What is 2 + 2?",
            choices=["3", "4", "5", "6"],
            correct_answer_index=1,
            tier=1
        )
        Question.objects.create(
            knowledge_point=kp_addition,
            text="What is 5 + 3?",
            choices=["6", "7", "8", "9"],
            correct_answer_index=2,
            tier=2
        )

        # Multiplication Questions
        Question.objects.create(
            knowledge_point=kp_multiplication,
            text="What is 3 x 4?",
            choices=["10", "11", "12", "14"],
            correct_answer_index=2,
            tier=1
        )
        Question.objects.create(
            knowledge_point=kp_multiplication,
            text="What is 6 x 7?",
            choices=["42", "40", "36", "48"],
            correct_answer_index=0,
            tier=2
        )

        # Exponent Questions
        Question.objects.create(
            knowledge_point=kp_exponents,
            text="What is 5 squared (5^2)?",
            choices=["10", "20", "25", "50"],
            correct_answer_index=2,
            tier=1
        )
        Question.objects.create(
            knowledge_point=kp_exponents,
            text="What is 3 squared (3^2)?",
            choices=["6", "9", "12", "27"],
            correct_answer_index=1,
            tier=2
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded the Math Knowledge Graph!"))
