from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Avg, Count
from users.models import Learner
from questions.models import TopicMastery, PracticeSession
from datetime import timedelta
from django.utils import timezone
import math

""" 
    The following func. AggregatedMetrics retrives aggregated platform metrics including 
    review counts, active users, mastery averages, and estimated retention.
"""
class AggregatedMetricsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    
    def get(self, request):
        # 1. Get Review Count (Practice Sessions)
        review_count = PracticeSession.objects.count()

        if review_count < 10:
            return Response(
                {"error": "Insufficient data for analysis", "review_count": review_count},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Get Active Users (7 & 30 days)
        now = timezone.now()
        active_7_days = Learner.objects.filter(last_practice_date__gte=now.date() - timedelta(days=7)).count()
        active_30_days = Learner.objects.filter(last_practice_date__gte=now.date() - timedelta(days=30)).count()

        # 3. Get Topic Mastery Averages
        mastery_stats = TopicMastery.objects.aggregate(
            avg_stability=Avg('stability'),
            avg_difficulty=Avg('difficulty')
        )

        # 4. Calculate Retention Metrics (Simplified representation)
        # Retention = Average Retrievability across all mastery items
        # Since retrievability is a formula, we can't easily aggregate it in SQL
        # We'll take a sample or average stability to estimate
        avg_stability = mastery_stats['avg_stability'] or 0

        # R = e^(t/s * ln(0.9)), assuming t=1 (1 day since last review)
        retention_rate = math.exp(1 / max(avg_stability, 1) * math.log(0.9)) if avg_stability > 0 else 0

        return Response({
            "review_count": review_count,
            "active_users": {
                "7_days": active_7_days,
                "30_days": active_30_days
            },
            "mastery_averages": mastery_stats,
            "estimated_retention": round(retention_rate, 4)
        })


"""
    Retrieves specific performance analytics, mastery averages, 
    and stability distribution for a given topic.
"""
class TopicAnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    
    def get(self, request, topic_id):
        # Get specific analytics for a topic
        stats = TopicMastery.objects.filter(topic_id=topic_id).aggregate(
            avg_stability=Avg('stability'),
            avg_difficulty=Avg('difficulty'),
            learner_count=Count('learner', distinct=True)
        )
        
        # Performance distribution (e.g. how many learners in stability tiers)
        distribution = {
            "low_stability": TopicMastery.objects.filter(topic_id=topic_id, stability__lt=5).count(),
            "medium_stability": TopicMastery.objects.filter(topic_id=topic_id, stability__gte=5, stability__lt=20).count(),
            "high_stability": TopicMastery.objects.filter(topic_id=topic_id, stability__gte=20).count()
        }

        return Response({
            "topic_id": topic_id,
            "metrics": stats,
            "distribution": distribution
        })
