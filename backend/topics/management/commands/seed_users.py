from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Seeds the database with default test users for development.'

    def handle(self, *args, **options):
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
                user.streak_count = xp // 100  # arbitrary but realistic

            user.save()

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
            else:
                skipped_count += 1
                self.stdout.write(f'Updated existing user: {username}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. Created: {created_count}, Skipped: {skipped_count}'
            )
        )