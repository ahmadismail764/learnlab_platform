import random
from django.core.management.base import BaseCommand
from topics.models import Topic, Subtopic
from practice.models import Question

class Command(BaseCommand):
    help = 'Seeds the database with initial topics, subtopics, and practice questions.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting the database seeding process...'))

        # Data structure for seeding
        seed_data = [
            {
                "topic": "Mathematics",
                "description": "Fundamental mathematics concepts.",
                "subtopics": [
                    {
                        "name": "Algebra",
                        "description": "Basic algebra operations and equations.",
                        "questions": [
                            {
                                "text": "Solve for x: 2x + 5 = 15",
                                "choices": ["5", "10", "4", "6"],
                                "correct_answer_index": 0,
                                "tier": 1
                            },
                            {
                                "text": "What is the value of y in y/3 = 7?",
                                "choices": ["10", "21", "14", "24"],
                                "correct_answer_index": 1,
                                "tier": 1
                            },
                            {
                                "text": "Factor the expression: x^2 + 5x + 6",
                                "choices": ["(x+2)(x+3)", "(x+1)(x+6)", "(x-2)(x-3)", "(x+5)(x+1)"],
                                "correct_answer_index": 0,
                                "tier": 2
                            }
                        ]
                    },
                    {
                        "name": "Geometry",
                        "description": "Shapes, sizes, and properties of space.",
                        "questions": [
                            {
                                "text": "What is the sum of angles in a triangle?",
                                "choices": ["90 degrees", "180 degrees", "360 degrees", "270 degrees"],
                                "correct_answer_index": 1,
                                "tier": 1
                            },
                            {
                                "text": "Calculate the area of a rectangle with length 5 and width 4.",
                                "choices": ["20", "9", "18", "25"],
                                "correct_answer_index": 0,
                                "tier": 2
                            }
                        ]
                    }
                ]
            },
            {
                "topic": "Computer Science",
                "description": "Programming and computer fundamentals.",
                "subtopics": [
                    {
                        "name": "Data Structures",
                        "description": "Organizing and storing data.",
                        "questions": [
                            {
                                "text": "Which data structure uses LIFO (Last In First Out)?",
                                "choices": ["Queue", "Tree", "Stack", "Graph"],
                                "correct_answer_index": 2,
                                "tier": 1
                            },
                            {
                                "text": "What is the time complexity of searching in a balanced Binary Search Tree?",
                                "choices": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
                                "correct_answer_index": 2,
                                "tier": 2
                            }
                        ]
                    },
                    {
                        "name": "Algorithms",
                        "description": "Step by step problem solving procedures.",
                        "questions": [
                            {
                                "text": "Which sorting algorithm is generally considered the fastest for large datasets?",
                                "choices": ["Bubble Sort", "Insertion Sort", "Selection Sort", "Quick Sort / Merge Sort"],
                                "correct_answer_index": 3,
                                "tier": 1
                            }
                        ]
                    }
                ]
            },
            {
                "topic": "Physics",
                "description": "The study of matter, energy, and the fundamental forces of nature.",
                "subtopics": [
                    {
                        "name": "Kinematics",
                        "description": "The study of motion without considering its causes.",
                        "questions": [
                            {
                                "text": "What is the SI unit of acceleration?",
                                "choices": ["m/s", "m/s^2", "N", "J"],
                                "correct_answer_index": 1,
                                "tier": 1
                            },
                            {
                                "text": "A car accelerates from rest to 20 m/s in 5 seconds. What is its acceleration?",
                                "choices": ["2 m/s^2", "3 m/s^2", "4 m/s^2", "5 m/s^2"],
                                "correct_answer_index": 2,
                                "tier": 2
                            }
                        ]
                    }
                ]
            }
        ]

        total_topics = 0
        total_subtopics = 0
        total_questions = 0

        for topic_data in seed_data:
            topic, topic_created = Topic.objects.get_or_create(
                name=topic_data["topic"],
                defaults={"description": topic_data["description"]}
            )
            
            if topic_created:
                self.stdout.write(self.style.SUCCESS(f'Created Topic: {topic.name}'))
                total_topics += 1

            for subtopic_data in topic_data["subtopics"]:
                subtopic, subtopic_created = Subtopic.objects.get_or_create(
                    topic=topic,
                    name=subtopic_data["name"],
                    defaults={"description": subtopic_data["description"]}
                )
                
                if subtopic_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created Subtopic: {subtopic.name}'))
                    total_subtopics += 1

                for q_data in subtopic_data["questions"]:
                    question, question_created = Question.objects.get_or_create(
                        subtopic=subtopic,
                        text=q_data["text"],
                        defaults={
                            "choices": q_data["choices"],
                            "correct_answer_index": q_data["correct_answer_index"],
                            "tier": q_data.get("tier", 1)
                        }
                    )
                    
                    if question_created:
                        total_questions += 1

        self.stdout.write(self.style.SUCCESS(f'\nSeeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'Topics Created: {total_topics}'))
        self.stdout.write(self.style.SUCCESS(f'Subtopics Created: {total_subtopics}'))
        self.stdout.write(self.style.SUCCESS(f'Questions Created: {total_questions}'))
