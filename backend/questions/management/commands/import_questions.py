import csv
from django.core.management.base import BaseCommand, CommandError
from topics.models import Topic, Subtopic
from practice.models import Question


class Command(BaseCommand):
    help = (
        'Import questions from a CSV file. '
        'CSV must have columns: topic, subtopic, tier, text, '
        'choice_1, choice_2, choice_3, choice_4, correct_answer_index'
    )

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
            reader = csv.DictReader(fh)

            required_columns = [
                'topic', 'subtopic', 'tier', 'text',
                'choice_1', 'choice_2', 'choice_3', 'choice_4',
                'correct_answer_index',
            ]
            missing = [col for col in required_columns if col not in reader.fieldnames]
            if missing:
                raise CommandError(
                    f'Missing required CSV columns: {", ".join(missing)}'
                )

            topics_created = 0
            subtopics_created = 0
            questions_created = 0
            duplicates_skipped = 0
            row_number = 1

            for row in reader:
                row_number += 1

                topic_name = row['topic'].strip()
                if not topic_name:
                    self.stdout.write(self.style.WARNING(
                        f'Row {row_number}: skipping row with empty topic.'
                    ))
                    continue

                topic, topic_created = Topic.objects.get_or_create(
                    name=topic_name,
                    defaults={'description': ''},
                )
                if topic_created:
                    topics_created += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'  Created Topic: {topic.name}'
                    ))

                subtopic_name = row['subtopic'].strip()
                if not subtopic_name:
                    self.stdout.write(self.style.WARNING(
                        f'Row {row_number}: skipping row with empty subtopic.'
                    ))
                    continue

                subtopic, subtopic_created = Subtopic.objects.get_or_create(
                    topic=topic,
                    name=subtopic_name,
                    defaults={'description': ''},
                )
                if subtopic_created:
                    subtopics_created += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'    Created Subtopic: {subtopic.name}'
                    ))

                text = row['text'].strip()
                if not text:
                    self.stdout.write(self.style.WARNING(
                        f'Row {row_number}: skipping row with empty text.'
                    ))
                    continue

                choices = [
                    row['choice_1'].strip(),
                    row['choice_2'].strip(),
                    row['choice_3'].strip(),
                    row['choice_4'].strip(),
                ]

                try:
                    tier = int(row['tier'].strip())
                except (ValueError, TypeError):
                    tier = 1

                try:
                    correct_answer_index = int(row['correct_answer_index'].strip())
                except (ValueError, TypeError):
                    self.stdout.write(self.style.ERROR(
                        f'Row {row_number}: invalid correct_answer_index '
                        f'"{row["correct_answer_index"]}", skipping.'
                    ))
                    continue

                question, question_created = Question.objects.get_or_create(
                    subtopic=subtopic,
                    text=text,
                    defaults={
                        'choices': choices,
                        'correct_answer_index': correct_answer_index,
                        'tier': tier,
                    },
                )

                if question_created:
                    questions_created += 1
                else:
                    duplicates_skipped += 1
                    self.stdout.write(self.style.WARNING(
                        f'Row {row_number}: duplicate skipped — '
                        f'[{subtopic.name}] {text[:60]}'
                    ))

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 50))
        self.stdout.write(self.style.SUCCESS('Import complete!'))
        self.stdout.write(self.style.SUCCESS(f'  Topics created:       {topics_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Subtopics created:    {subtopics_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Questions created:    {questions_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Duplicates skipped:   {duplicates_skipped}'))
        self.stdout.write(self.style.SUCCESS('=' * 50))