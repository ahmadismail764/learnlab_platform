from django.core.management.base import BaseCommand
from django.utils import timezone
from collections import defaultdict
from questions.models import TopicMastery

class Command(BaseCommand):
    help = 'Sends practice sheet reminders to learners with topics needing practice.'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Query all TopicMastery records with low mastery level
        due_masteries = TopicMastery.objects.filter(
            mastery_level__lt=50.0
        ).select_related('learner__user')
        
        # Group by learner
        learner_due_counts = defaultdict(int)
        for mastery in due_masteries:
            username = mastery.learner.user.username
            learner_due_counts[username] += 1
            
        if not learner_due_counts:
            self.stdout.write(self.style.SUCCESS("No learners have topics needing practice today."))
            return

        # Print reminders
        for username, count in learner_due_counts.items():
            self.stdout.write(
                self.style.WARNING(f"Reminder: {username} has {count} topics needing practice today.")
            )
        
        self.stdout.write(self.style.SUCCESS(f"Processed reminders for {len(learner_due_counts)} learners."))
