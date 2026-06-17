from rest_framework.routers import DefaultRouter
from topics.views import TopicViewSet, SubtopicViewSet, SubtopicMasteryViewSet

topics_router = DefaultRouter()
topics_router.register(r'topics', TopicViewSet, basename='topic')

subtopics_router = DefaultRouter()
subtopics_router.register(r'subtopics', SubtopicViewSet, basename='subtopic')

mastery_router = DefaultRouter()
mastery_router.register(r'mastery', SubtopicMasteryViewSet, basename='subtopic-mastery')

urlpatterns = topics_router.urls + subtopics_router.urls + mastery_router.urls

# urlpatterns.append(path(leaderboard/', LeaderboardView.as_view(), name='leaderboard'))