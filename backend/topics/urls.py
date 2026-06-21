# Core django imports
from django.urls import path
# DRF imports
from rest_framework.routers import DefaultRouter
# Our imports
from topics.views import (
    TopicViewSet,
    SubtopicViewSet,
    SubtopicMasteryViewSet,
    LeaderboardView,
    ExtractQuestionsAPIView
)


topics_router = DefaultRouter()
topics_router.register(r'topics', TopicViewSet, basename='topic')

subtopics_router = DefaultRouter()
subtopics_router.register(r'subtopics', SubtopicViewSet, basename='subtopic')

mastery_router = DefaultRouter()
mastery_router.register(r'mastery', SubtopicMasteryViewSet, basename='subtopic-mastery')

urlpatterns = topics_router.urls + subtopics_router.urls + mastery_router.urls

urlpatterns.append(path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'))
urlpatterns.append(path('extract-questions/', ExtractQuestionsAPIView.as_view(), name='extract-questions'))