import ast
import csv
import os
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User
from topics.models import Topic, Subtopic
from practice.models import Question


class Command(BaseCommand):
    help = 'Seeds the database with test users and imports questions from a CSV file.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            action='store_true',
            help='Seed test users.',
        )
        parser.add_argument(
            '--questions',
            type=str,
            metavar='CSV_FILE',
            help='Path to the questions CSV file to import.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all setup steps using the default CSV path.',
        )

    def handle(self, *args, **options):
        run_all = options['all']

        if run_all or options['users']:
            self._seed_users()

        if run_all:
            default_csv = os.path.join(
                os.path.dirname(__file__),
                '..', 'books_and_questions', 'questions.csv'
            )
            self._import_questions(default_csv)
        elif options['questions']:
            self._import_questions(options['questions'])

        if not any([run_all, options['users'], options['questions']]):
            self.stdout.write(self.style.WARNING(
                'No options specified. Use --users, --questions <path>, or --all.'
            ))

    def _seed_users(self):
        self.stdout.write('Seeding users...')

        users = [
            {
                'username': 'admin',
                'email': 'admin@learnlab.com',
                'password': 'admin123',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'username': 'learner',
                'email': 'learner@learnlab.com',
                'password': 'learner123',
                'first_name': 'John',
                'last_name': 'Doe',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'learner2',
                'email': 'learner2@learnlab.com',
                'password': 'learner123',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'learner3',
                'email': 'learner3@learnlab.com',
                'password': 'learner123',
                'first_name': 'Ahmed',
                'last_name': 'Hassan',
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        xp_data = {
            'learner': 350,
            'learner2': 210,
            'learner3': 80,
        }

        created_count = 0
        skipped_count = 0

        for user_data in users:
            seed_data = user_data.copy()
            username = seed_data.pop('username')
            password = seed_data.pop('password')
            is_staff = seed_data.pop('is_staff')
            is_superuser = seed_data.pop('is_superuser')

            user, created = User.objects.update_or_create(
                username=username,
                defaults=seed_data
            )

            user.set_password(password)
            user.is_staff = is_staff
            user.is_superuser = is_superuser

            if username in xp_data:
                xp = xp_data[username]
                user.current_xp = xp
                user.streak_count = xp // 100

            user.save()

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created user: {username}'))
            else:
                skipped_count += 1
                self.stdout.write(f'  Updated existing user: {username}')

        self.stdout.write(self.style.SUCCESS(
            f'Users done. Created: {created_count}, Updated: {skipped_count}\n'
        ))

    def _import_questions(self, csv_file):
        self.stdout.write(f'Importing questions from {csv_file}...')

        try:
            fh = open(csv_file, newline='', encoding='utf-8')
        except FileNotFoundError:
            raise CommandError(f'File not found: {csv_file}')

        with fh:
            fieldnames = ['topic', 'subtopic', 'tier', 'text', 'choices', 'correct_answer_index']
            reader = csv.DictReader(fh, fieldnames=fieldnames)
            next(reader, None)

            topics_created = 0
            subtopics_created = 0
            questions_created = 0
            duplicates_skipped = 0
            row_number = 1

            for row in reader:
                row_number += 1

                if not row['topic'] or not row['subtopic'] or not row['text']:
                    self.stdout.write(self.style.WARNING(
                        f'  Row {row_number}: missing vital data, skipping.'
                    ))
                    continue

                topic, created = Topic.objects.get_or_create(
                    name=row['topic'].strip(),
                    defaults={'description': ''},
                )
                if created:
                    topics_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  Created topic: {row["topic"].strip()}'))

                subtopic, created = Subtopic.objects.get_or_create(
                    topic=topic,
                    name=row['subtopic'].strip(),
                    defaults={'description': ''},
                )
                if created:
                    subtopics_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  Created subtopic: {row["subtopic"].strip()}'))

                text = row['text'].strip()
                raw_choices = row['choices']
                try:
                    choices_list = ast.literal_eval(raw_choices.strip())
                    if not isinstance(choices_list, list):
                        choices_list = [raw_choices]
                except Exception:
                    choices_list = [c.strip() for c in raw_choices.split(',')]

                try:
                    tier = int(row['tier'].strip())
                except (ValueError, TypeError, AttributeError):
                    tier = 1

                try:
                    correct_answer_index = int(row['correct_answer_index'].strip())
                except (ValueError, TypeError, AttributeError):
                    self.stdout.write(self.style.ERROR(
                        f'  Row {row_number}: invalid correct_answer_index, skipping.'
                    ))
                    continue

                question, created = Question.objects.get_or_create(
                    subtopic=subtopic,
                    text=text,
                    defaults={
                        'choices': choices_list,
                        'correct_answer_index': correct_answer_index,
                        'tier': tier,
                    },
                )

                if created:
                    questions_created += 1
                else:
                    duplicates_skipped += 1
                    self.stdout.write(self.style.WARNING(
                        f'  Row {row_number}: duplicate skipped — [{subtopic.name}] {text[:60]}'
                    ))

        self.stdout.write(self.style.SUCCESS(
            f'Questions done. Topics: {topics_created}, Subtopics: {subtopics_created}, '
            f'Questions: {questions_created}, Duplicates skipped: {duplicates_skipped}\n'
        ))