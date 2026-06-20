import csv
import json
import os
from django.core.management.base import BaseCommand
from topics.models import Topic, Subtopic
from practice.models import Question

class Command(BaseCommand):
    help = 'Imports questions from a CSV file'

    def handle(self, *args, **kwargs):
        csv_path = "data/questions.csv"
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"CSV file not found at {csv_path}"))
            return

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            
            for row in reader:
                topic_name = row['topic'].strip()
                subtopic_name = row['subtopic'].strip()
                tier = int(row['tier'].strip())
                text = row['text'].strip()
                choices_str = row['choices']
                correct_idx = int(row['correct_answer_index'].strip())
                
                # Parse JSON choices
                try:
                    choices = json.loads(choices_str)
                except json.JSONDecodeError:
                    choices = [c.strip().strip('"').strip("'") for c in choices_str.strip('[]').split(',')]
                
                topic_obj, _ = Topic.objects.get_or_create(name=topic_name)
                subtopic_obj, _ = Subtopic.objects.get_or_create(topic=topic_obj, name=subtopic_name)
                
                q, created = Question.objects.get_or_create(
                    subtopic=subtopic_obj,
                    text=text,
                    defaults={
                        'tier': tier,
                        'choices': choices,
                        'correct_answer_index': correct_idx
                    }
                )
                if created:
                    count += 1
                    
        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} questions from CSV into the database!'))
