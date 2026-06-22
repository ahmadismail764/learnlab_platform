import ast
import csv
from django.core.management.base import BaseCommand, CommandError
from topics.models import Topic, Subtopic
from practice.models import Question


class Command(BaseCommand):
    help = 'Import questions from a custom structured CSV file.'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,   
            help='Path to the CSV file to import.',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']

        try:
            fh = open(csv_file, newline='', encoding='utf-8')
        except FileNotFoundError:
            raise CommandError(f'File not found: {csv_file}')

        with fh:
            # We explicitly define the fieldnames because line 1 in your CSV 
            # appears broken/truncated (e.g., 'er,text,choices...')
            fieldnames = [
                'topic', 'subtopic', 'tier', 'text', 
                'choices', 'correct_answer_index'
            ]
            
            # Use restkey to catch any overflow, but we map the core columns explicitly
            reader = csv.DictReader(fh, fieldnames=fieldnames)
            
            # Skip the very first header row manually
            next(reader, None)

            topics_created = 0
            subtopics_created = 0
            questions_created = 0
            duplicates_skipped = 0
            row_number = 1

            for row in reader:
                row_number += 1

                # Safely handle missing columns if a row is malformed
                if not row['topic'] or not row['subtopic'] or not row['text']:
                    self.stdout.write(self.style.WARNING(
                        f'Row {row_number}: Missing vital data, skipping.'
                    ))
                    continue

                topic_name = row['topic'].strip()
                topic, topic_created = Topic.objects.get_or_create(
                    name=topic_name,
                    defaults={'description': ''},
                )
                if topic_created:
                    topics_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  Created Topic: {topic.name}'))

                subtopic_name = row['subtopic'].strip()
                subtopic, subtopic_created = Subtopic.objects.get_or_create(
                    topic=topic,
                    name=subtopic_name,
                    defaults={'description': ''},
                )
                if subtopic_created:
                    subtopics_created += 1
                    self.stdout.write(self.style.SUCCESS(f'    Created Subtopic: {subtopic.name}'))

                text = row['text'].strip()

                # Safely parse the choices string array into a Python list
                raw_choices = row['choices']
                try:
                    # Converts '["A", "B", "C"]' string into an actual list ["A", "B", "C"]
                    choices_list = ast.literal_eval(raw_choices.strip())
                    if not isinstance(choices_list, list):
                        choices_list = [raw_choices]
                except Exception:
                    # Fallback if parsing fails
                    choices_list = [c.strip() for c in raw_choices.split(',')]

                try:
                    tier = int(row['tier'].strip())
                except (ValueError, TypeError, AttributeError):
                    tier = 1

                try:
                    correct_answer_index = int(row['correct_answer_index'].strip())
                except (ValueError, TypeError, AttributeError):
                    self.stdout.write(self.style.ERROR(
                        f'Row {row_number}: invalid correct_answer_index, skipping.'
                    ))
                    continue

                question, question_created = Question.objects.get_or_create(
                    subtopic=subtopic,
                    text=text,
                    defaults={
                        'choices': choices_list,
                        'correct_answer_index': correct_answer_index,
                        'tier': tier,
                    },
                )

                if question_created:
                    questions_created += 1
                else:
                    duplicates_skipped += 1
                    self.stdout.write(self.style.WARNING(
                        f'Row {row_number}: duplicate skipped — [{subtopic.name}] {text[:60]}'
                    ))

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 50))
        self.stdout.write(self.style.SUCCESS('Import complete!'))
        self.stdout.write(self.style.SUCCESS(f'  Topics created:       {topics_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Subtopics created:    {subtopics_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Questions created:    {questions_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Duplicates skipped:   {duplicates_skipped}'))
        self.stdout.write(self.style.SUCCESS('=' * 50))