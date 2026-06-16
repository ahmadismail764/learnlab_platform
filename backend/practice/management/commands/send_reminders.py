from django.core.management.base import BaseCommand
from django.utils import timezone
from collections import defaultdict
from questions.models import TopicMastery

class Command(BaseCommand):
    help = 'Sends practice sheet reminders to learners with due FSRS topics.'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Query all TopicMastery records due for review
        due_masteries = TopicMastery.objects.filter(
            next_review_date__lte=now
        ).select_related('learner__user')
        
        # Group by learner
        learner_due_counts = defaultdict(int)
        for mastery in due_masteries:
            # Assumes Learner model has a user relation
            username = mastery.learner.user.username
            learner_due_counts[username] += 1
            
        if not learner_due_counts:
            self.stdout.write(self.style.SUCCESS("No learners have topics due for review today."))
            return

        # Print reminders
        for username, count in learner_due_counts.items():
            self.stdout.write(
                self.style.WARNING(f"Reminder: {username} has {count} topics due for review today.")
            )
        
        self.stdout.write(self.style.SUCCESS(f"Processed reminders for {len(learner_due_counts)} learners."))
