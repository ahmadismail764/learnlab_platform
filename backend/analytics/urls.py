from django.urls import path
from analytics.views import (
    AggregatedMetricsView,
    TopicAnalyticsView,
    BulkTopicAnalyticsView,
    ActivityTimeSeriesView,
    DifficultyBreakdownView,
)

urlpatterns = [
    path('aggregated/', AggregatedMetricsView.as_view(), name='analytics-aggregated'),
    path('topics/', BulkTopicAnalyticsView.as_view(), name='analytics-topics-bulk'),
    path('topics/<uuid:topic_id>/', TopicAnalyticsView.as_view(), name='analytics-topic-detail'),
    path('activity/', ActivityTimeSeriesView.as_view(), name='analytics-activity'),
    path('difficulty/', DifficultyBreakdownView.as_view(), name='analytics-difficulty'),
]
