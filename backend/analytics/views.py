import math
# Django imports
from django.db.models import Avg, Count
from django.utils import timezone
# DRF imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
# Internal imports
from accounts.models import User
from practice.models import PracticeSession, QuestionResponse
from topics.models import SubtopicMastery, Topic


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

        # Estimated retention for topic
        now = timezone.now()
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
            'topic_id': topic_id,
            'metrics': {
                'avg_speed': avg_speed_val,
                'avg_difficulty': avg_difficulty_val,
                'learner_count': learner_count,
                'estimated_retention': estimated_retention,
            },
            'distribution': {
                'low_speed': low_speed,
                'medium_speed': medium_speed,
                'high_speed': high_speed,
            }
        })


class BulkTopicAnalyticsView(APIView):
    """
    GET /analytics/topics/
    Returns per-topic analytics for all topics in one request.
    Supports optional filter: ?topic_ids=uuid1,uuid2
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = Topic.objects.all()
        topic_ids_param = request.query_params.get('topic_ids')
        if topic_ids_param:
            ids = [t.strip() for t in topic_ids_param.split(',')]
            topics = topics.filter(id__in=ids)

        now = timezone.now()
        results = []
        for topic in topics:
            masteries = SubtopicMastery.objects.filter(subtopic__topic=topic)
            avg_speed = masteries.aggregate(Avg('stability'))['stability__avg']
            avg_difficulty = masteries.aggregate(Avg('difficulty'))['difficulty__avg']
            learner_count = masteries.values('learner').distinct().count()

            retention_sum, count = 0, 0
            for m in masteries:
                if m.stability > 0 and m.last_review:
                    elapsed = (now - m.last_review).total_seconds() / 86400
                    retention_sum += math.exp(math.log(0.9) * elapsed / m.stability)
                    count += 1

            results.append({
                'topic_id': str(topic.id),
                'topic_name': topic.name,
                'metrics': {
                    'avg_speed': round(avg_speed, 2) if avg_speed else 1.0,
                    'avg_difficulty': round(avg_difficulty, 2) if avg_difficulty else 5.0,
                    'estimated_retention': round(retention_sum / count, 4) if count > 0 else 0.85,
                    'learner_count': learner_count,
                },
                'distribution': {
                    'low_speed': masteries.filter(stability__lt=3.0).count(),
                    'medium_speed': masteries.filter(stability__gte=3.0, stability__lte=7.0).count(),
                    'high_speed': masteries.filter(stability__gt=7.0).count(),
                },
            })

        return Response({'results': results})


class ActivityTimeSeriesView(APIView):
    """
    GET /analytics/activity/
    Returns daily active learners and questions answered.
    Supports ?period=7d|30d|90d (default: 7d) or ?start=YYYY-MM-DD&end=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date, timedelta
        from django.db.models.functions import TruncDate

        period = request.query_params.get('period', '7d')
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')

        today = date.today()
        if start_str and end_str:
            from datetime import datetime
            start = datetime.strptime(start_str, '%Y-%m-%d').date()
            end = datetime.strptime(end_str, '%Y-%m-%d').date()
        else:
            days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 7)
            start = today - timedelta(days=days - 1)
            end = today

        # Build a date range
        date_range = []
        cur = start
        while cur <= end:
            date_range.append(cur)
            cur += timedelta(days=1)

        # Sessions per day
        sessions_qs = (
            PracticeSession.objects
            .filter(start_time__date__range=(start, end))
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(active_learners=Count('learner', distinct=True))
        )
        sessions_map = {row['day']: row['active_learners'] for row in sessions_qs}

        # Responses per day
        responses_qs = (
            QuestionResponse.objects
            .filter(session__start_time__date__range=(start, end))
            .annotate(day=TruncDate('session__start_time'))
            .values('day')
            .annotate(questions_answered=Count('id'))
        )
        responses_map = {row['day']: row['questions_answered'] for row in responses_qs}

        results = [
            {
                'date': str(d),
                'active_learners': sessions_map.get(d, 0),
                'questions_answered': responses_map.get(d, 0),
            }
            for d in date_range
        ]

        return Response({'bucket': 'day', 'results': results})


class DifficultyBreakdownView(APIView):
    """
    GET /analytics/difficulty/
    Returns attempts and accuracy broken down by question difficulty tier (1, 2, 3).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tiers = {}
        for tier in [1, 2, 3]:
            responses = QuestionResponse.objects.filter(question__tier=tier)
            total = responses.count()
            correct = responses.filter(is_correct=True).count()
            tiers[str(tier)] = {
                'attempts': total,
                'accuracy': round(correct / total, 4) if total > 0 else 0.0,
            }
        return Response({'tiers': tiers})

