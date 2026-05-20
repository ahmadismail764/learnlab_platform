from django.urls import path
from analytics.views import AggregatedMetricsView, TopicAnalyticsView

urlpatterns = [
    path('aggregated/', AggregatedMetricsView.as_view(), name='analytics-aggregated'),
    path('topics/<uuid:topic_id>/', TopicAnalyticsView.as_view(), name='analytics-topic-detail'),
]
