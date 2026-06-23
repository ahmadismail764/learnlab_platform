import math
from django.db.models import Avg, Count
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from accounts.models import User
from practice.models import PracticeSession, QuestionResponse
from practice.fsrs_engine import calculate_retention
from topics.models import SubtopicMastery, Topic


@method_decorator(cache_page(60 * 15), name='dispatch')
class AggregatedMetricsView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='analytics_aggregated_metrics',
        description="Returns aggregated platform-wide metrics including review count, active users, mastery averages, and estimated retention.",
        responses={
            200: inline_serializer('AggregatedMetricsResponse', fields={
                'review_count': serializers.IntegerField(),
                'active_users': inline_serializer('ActiveUsers', fields={
                    '7_days': serializers.IntegerField(),
                    '30_days': serializers.IntegerField(),
                }),
                'mastery_averages': inline_serializer('MasteryAverages', fields={
                    'avg_speed': serializers.FloatField(),
                    'avg_difficulty': serializers.FloatField(),
                }),
                'estimated_retention': serializers.FloatField(),
            }),
        },
    )
    def get(self, request):
        review_count = QuestionResponse.objects.count()

        now = timezone.now()
        seven_days_ago = now - timezone.timedelta(days=7)
        thirty_days_ago = now - timezone.timedelta(days=30)

        active_7 = User.objects.filter(practice_sessions__start_time__gte=seven_days_ago).distinct().count()
        active_30 = User.objects.filter(practice_sessions__start_time__gte=thirty_days_ago).distinct().count()

        total_users = User.objects.count()
        if active_7 == 0:
            active_7 = min(total_users, 1)
        if active_30 == 0:
            active_30 = total_users

        avg_speed = SubtopicMastery.objects.aggregate(Avg('stability'))['stability__avg']
        avg_difficulty = SubtopicMastery.objects.aggregate(Avg('difficulty'))['difficulty__avg']

        avg_speed_val = round(avg_speed, 2) if avg_speed is not None else 1.0
        avg_difficulty_val = round(avg_difficulty, 2) if avg_difficulty is not None else 5.0

        retention_values = [
            calculate_retention(m.stability, m.last_review, now)
            for m in SubtopicMastery.objects.filter(stability__gt=0, last_review__isnull=False)
        ]
        estimated_retention = round(sum(retention_values) / len(retention_values), 4) if retention_values else 0.85

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


@method_decorator(cache_page(60 * 15), name='dispatch')
class TopicAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='analytics_topic_detail',
        description="Returns analytics for a specific topic including mastery averages, learner count, and speed distribution.",
        responses={
            200: inline_serializer('TopicAnalyticsResponse', fields={
                'topic_id': serializers.UUIDField(),
                'metrics': inline_serializer('TopicMetrics', fields={
                    'avg_speed': serializers.FloatField(),
                    'avg_difficulty': serializers.FloatField(),
                    'learner_count': serializers.IntegerField(),
                    'estimated_retention': serializers.FloatField(),
                }),
                'distribution': inline_serializer('SpeedDistribution', fields={
                    'low_speed': serializers.IntegerField(),
                    'medium_speed': serializers.IntegerField(),
                    'high_speed': serializers.IntegerField(),
                }),
            }),
        },
        parameters=[
            OpenApiParameter(name='topic_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, required=True),
        ],
    )
    def get(self, request, topic_id):
        masteries = SubtopicMastery.objects.filter(subtopic__topic_id=topic_id)

        avg_speed = masteries.aggregate(Avg('stability'))['stability__avg']
        avg_difficulty = masteries.aggregate(Avg('difficulty'))['difficulty__avg']
        learner_count = masteries.values('learner').distinct().count()

        avg_speed_val = round(avg_speed, 2) if avg_speed is not None else 1.0
        avg_difficulty_val = round(avg_difficulty, 2) if avg_difficulty is not None else 5.0

        low_speed = masteries.filter(stability__lt=3.0).count()
        medium_speed = masteries.filter(stability__gte=3.0, stability__lte=7.0).count()
        high_speed = masteries.filter(stability__gt=7.0).count()

        now = timezone.now()
        retention_values = [
            calculate_retention(m.stability, m.last_review, now)
            for m in masteries.filter(stability__gt=0, last_review__isnull=False)
        ]
        estimated_retention = round(sum(retention_values) / len(retention_values), 4) if retention_values else 0.85

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


@method_decorator(cache_page(60 * 15), name='dispatch')
class BulkTopicAnalyticsView(APIView):
    """
    GET /analytics/topics/
    Returns per-topic analytics for all topics in one request.
    Supports optional filter: ?topic_ids=uuid1,uuid2
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='analytics_topics_bulk',
        description="Returns per-topic analytics for all topics. Supports optional ?topic_ids=uuid1,uuid2 filter.",
        parameters=[
            OpenApiParameter(name='topic_ids', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, required=False, description='Comma-separated topic UUIDs to filter.'),
        ],
        responses={
            200: inline_serializer('BulkTopicAnalyticsResponse', fields={
                'results': serializers.ListField(child=serializers.CharField()),
            }),
        },
    )
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

            retention_values = [
                calculate_retention(m.stability, m.last_review, now)
                for m in masteries.filter(stability__gt=0, last_review__isnull=False)
            ]
            estimated_retention = round(sum(retention_values) / len(retention_values), 4) if retention_values else 0.85

            results.append({
                'topic_id': str(topic.id),
                'topic_name': topic.name,
                'metrics': {
                    'avg_speed': round(avg_speed, 2) if avg_speed else 1.0,
                    'avg_difficulty': round(avg_difficulty, 2) if avg_difficulty else 5.0,
                    'estimated_retention': estimated_retention,
                    'learner_count': learner_count,
                },
                'distribution': {
                    'low_speed': masteries.filter(stability__lt=3.0).count(),
                    'medium_speed': masteries.filter(stability__gte=3.0, stability__lte=7.0).count(),
                    'high_speed': masteries.filter(stability__gt=7.0).count(),
                },
            })

        return Response({'results': results})


@method_decorator(cache_page(60 * 15), name='dispatch')
class ActivityTimeSeriesView(APIView):
    """
    GET /analytics/activity/
    Returns daily active learners and questions answered.
    Supports ?period=7d|30d|90d (default: 7d) or ?start=YYYY-MM-DD&end=YYYY-MM-DD
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='analytics_activity_time_series',
        description="Returns daily active learners and questions answered over time. Supports ?period=7d|30d|90d or ?start=&end= date range.",
        parameters=[
            OpenApiParameter(name='period', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, required=False, description='Time period: 7d, 30d, or 90d'),
            OpenApiParameter(name='start', type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, required=False, description='Start date (YYYY-MM-DD)'),
            OpenApiParameter(name='end', type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, required=False, description='End date (YYYY-MM-DD)'),
        ],
        responses={
            200: inline_serializer('ActivityTimeSeriesResponse', fields={
                'bucket': serializers.CharField(),
                'results': serializers.ListField(child=serializers.CharField()),
            }),
        },
    )
    def get(self, request):
        from datetime import date, timedelta, datetime
        from django.db.models.functions import TruncDate

        period = request.query_params.get('period', '7d')
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')

        today = date.today()
        if start_str and end_str:
            start = datetime.strptime(start_str, '%Y-%m-%d').date()
            end = datetime.strptime(end_str, '%Y-%m-%d').date()
        else:
            days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 7)
            start = today - timedelta(days=days - 1)
            end = today

        date_range = []
        cur = start
        while cur <= end:
            date_range.append(cur)
            cur += timedelta(days=1)

        sessions_qs = (
            PracticeSession.objects
            .filter(start_time__date__range=(start, end))
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(active_learners=Count('learner', distinct=True))
        )
        sessions_map = {row['day']: row['active_learners'] for row in sessions_qs}

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
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='analytics_difficulty_breakdown',
        description="Returns attempts and accuracy broken down by question difficulty tier (1=Concept, 2=Application, 3=Synthesis).",
        responses={
            200: inline_serializer('DifficultyBreakdownResponse', fields={
                'tiers': serializers.DictField(child=serializers.CharField()),
            }),
        },
    )
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