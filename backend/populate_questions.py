import os
import django

# Set up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnlab_platform.settings')
django.setup()

from questions.models import Topic, KnowledgePoint, Question

topics_data = [
    {
        "name": "Algebra",
        "parent_module": "Mathematics",
        "description": "Basic algebra concepts.",
        "kps": [
            {
                "name": "Linear Equations",
                "description": "Solving for x in linear equations.",
                "questions": [
                    {
                        "text": "Solve for x: 2x + 3 = 7",
                        "choices": ["x = 1", "x = 2", "x = 3", "x = 4"],
                        "correct_answer_index": 1,
                        "tier": 1
                    },
                    {
                        "text": "Solve for x: 5x - 10 = 0",
                        "choices": ["x = 0", "x = 1", "x = 2", "x = -2"],
                        "correct_answer_index": 2,
                        "tier": 2
                    }
                ]
            }
        ]
    },
    {
        "name": "Data Structures",
        "parent_module": "Computer Science",
        "description": "Fundamental data structures in CS.",
        "kps": [
            {
                "name": "Arrays",
                "description": "Contiguous memory structures.",
                "questions": [
                    {
                        "text": "What is the time complexity to access an element in an array by index?",
                        "choices": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                        "correct_answer_index": 0,
                        "tier": 1
                    }
                ]
            },
            {
                "name": "Linked Lists",
                "description": "Node-based sequential memory structures.",
                "questions": [
                    {
                        "text": "Which of the following is true for Linked Lists?",
                        "choices": ["They are stored in contiguous memory", "They allow O(1) random access", "Nodes contain data and a reference to the next node", "Their size cannot change dynamically"],
                        "correct_answer_index": 2,
                        "tier": 1
                    }
                ]
            }
        ]
    },
    {
        "name": "Biology Basics",
        "parent_module": "Science",
        "description": "Introduction to biology.",
        "kps": [
            {
                "name": "Cells",
                "description": "Basic unit of life.",
                "questions": [
                    {
                        "text": "What is the powerhouse of the cell?",
                        "choices": ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"],
                        "correct_answer_index": 2,
                        "tier": 1
                    }
                ]
            }
        ]
    }
]

def run():
    for t_data in topics_data:
        topic, _ = Topic.objects.get_or_create(
            name=t_data["name"],
            defaults={"parent_module": t_data["parent_module"], "description": t_data["description"]}
        )
        for kp_data in t_data["kps"]:
            kp, _ = KnowledgePoint.objects.get_or_create(
                topic=topic,
                name=kp_data["name"],
                defaults={"description": kp_data["description"]}
            )
            for q_data in kp_data["questions"]:
                Question.objects.get_or_create(
                    text=q_data["text"],
                    knowledge_point=kp,
                    defaults={
                        "choices": q_data["choices"],
                        "correct_answer_index": q_data["correct_answer_index"],
                        "tier": q_data["tier"]
                    }
                )
    print("Dummy topics, knowledge points, and questions created successfully.")

if __name__ == "__main__":
    run()
