from django.urls import path
from .views import AggregatedMetricsView, TopicAnalyticsView

urlpatterns = [
    path('aggregated/', AggregatedMetricsView.as_view(), name='aggregated-metrics'),
    path('topic/<int:topic_id>/', TopicAnalyticsView.as_view(), name='topic-analytics'),
]
