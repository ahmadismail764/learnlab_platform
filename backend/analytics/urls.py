from django.urls import path
from .views import AggregatedMetricsView, SubtopicAnalyticsView

urlpatterns = [
    path('aggregated/', AggregatedMetricsView.as_view(), name='aggregated-metrics'),
    path('subtopic/<uuid:subtopic_id>/', SubtopicAnalyticsView.as_view(), name='subtopic-analytics'),
]
