from django.core.management.base import BaseCommand
from django.utils import timezone
from collections import defaultdict
from questions.models import TopicMastery

class Command(BaseCommand):
    help = 'Sends practice sheet reminders to students with due FSRS topics.'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Query all TopicMastery records due for review
        due_masteries = TopicMastery.objects.filter(
            next_review_date__lte=now
        ).select_related('student__user')
        
        # Group by student
        student_due_counts = defaultdict(int)
        for mastery in due_masteries:
            # Assumes Student model has a user relation
            username = mastery.student.user.username
            student_due_counts[username] += 1
            
        if not student_due_counts:
            self.stdout.write(self.style.SUCCESS("No students have topics due for review today."))
            return

        # Print reminders
        for username, count in student_due_counts.items():
            self.stdout.write(
                self.style.WARNING(f"Reminder: {username} has {count} topics due for review today.")
            )
        
        self.stdout.write(self.style.SUCCESS(f"Processed reminders for {len(student_due_counts)} students."))
