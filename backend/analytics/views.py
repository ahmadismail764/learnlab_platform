from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg
from accounts.models import User
from practice.models import PracticeSession, QuestionResponse
from topics.models import SubtopicMastery
import math
from django.utils import timezone

class AggregatedMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Calculate review count
        review_count = QuestionResponse.objects.count()

        # Active users count (e.g. 7 days and 30 days based on last_practice_date or joined_at)
        now = timezone.now()
        seven_days_ago = now - timezone.timedelta(days=7)
        thirty_days_ago = now - timezone.timedelta(days=30)

        active_7 = User.objects.filter(practice_sessions__start_time__gte=seven_days_ago).distinct().count()
        active_30 = User.objects.filter(practice_sessions__start_time__gte=thirty_days_ago).distinct().count()

        # Fallback to total users if no sessions yet
        total_users = User.objects.count()
        if active_7 == 0:
            active_7 = min(total_users, 1)
        if active_30 == 0:
            active_30 = total_users

        # Mastery averages
        avg_speed = SubtopicMastery.objects.aggregate(Avg('stability'))['stability__avg']
        avg_difficulty = SubtopicMastery.objects.aggregate(Avg('difficulty'))['difficulty__avg']

        # Default values if no mastery exists yet
        avg_speed_val = round(avg_speed, 2) if avg_speed is not None else 1.0
        avg_difficulty_val = round(avg_difficulty, 2) if avg_difficulty is not None else 5.0

        # Estimated retention (average retrievability across all masteries)
        masteries = SubtopicMastery.objects.all()
        retention_sum = 0
        count = 0
        for m in masteries:
            if m.stability > 0 and m.last_review:
                elapsed_days = (now - m.last_review).total_seconds() / 86400
                ret = math.exp(math.log(0.9) * elapsed_days / m.stability)
                retention_sum += ret
                count += 1
        
        estimated_retention = round(retention_sum / count, 4) if count > 0 else 0.85

        return Response({
            'review_count': review_count,
            'active_users': {
                '7_days': active_7,
                '30_days': active_30,
            },
            'mastery_averages': {
                'avg_speed': avg_speed_val,
                'avg_difficulty': avg_difficulty_val,
            },
            'estimated_retention': estimated_retention,
        })

class TopicAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        # Calculate subtopic mastery metrics under this topic
        masteries = SubtopicMastery.objects.filter(subtopic__topic_id=topic_id)
        
        avg_speed = masteries.aggregate(Avg('stability'))['stability__avg']
        avg_difficulty = masteries.aggregate(Avg('difficulty'))['difficulty__avg']
        learner_count = masteries.values('learner').distinct().count()

        # Default values if no mastery exists yet
        avg_speed_val = round(avg_speed, 2) if avg_speed is not None else 1.0
        avg_difficulty_val = round(avg_difficulty, 2) if avg_difficulty is not None else 5.0

        # Distribute speed (stability) categories
        low_speed = masteries.filter(stability__lt=3.0).count()
        medium_speed = masteries.filter(stability__gte=3.0, stability__lte=7.0).count()
        high_speed = masteries.filter(stability__gt=7.0).count()

        return Response({
            'topic_id': topic_id,
            'metrics': {
                'avg_speed': avg_speed_val,
                'avg_difficulty': avg_difficulty_val,
                'learner_count': learner_count,
            },
            'distribution': {
                'low_speed': low_speed,
                'medium_speed': medium_speed,
                'high_speed': high_speed,
            }
        })
