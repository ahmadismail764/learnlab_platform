from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import Learner
from questions.models import Notification
from questions.services import get_due_topics

class Command(BaseCommand):
    help = 'Sends practice sheet notifications to learners with due topics (FIRe).'

    def handle(self, *args, **options):
        now = timezone.now()
        
        learners = Learner.objects.all()
        notifications_created = 0
        
        for learner in learners:
            due_topics = get_due_topics(learner, limit=5)
            
            if due_topics:
                notification = Notification.objects.create(learner=learner)
                notification.topics.set(due_topics)
                notifications_created += 1
                
                self.stdout.write(
                    self.style.WARNING(f"Notification: {learner.user.username} has {len(due_topics)} topics due for review.")
                )
        
        if notifications_created == 0:
            self.stdout.write(self.style.SUCCESS("No learners have topics due for review today."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Processed notifications for {notifications_created} learners."))
