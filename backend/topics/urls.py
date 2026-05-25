from rest_framework.routers import DefaultRouter
from topics.views import TopicViewSet, SubtopicViewSet, SubtopicMasteryViewSet

router = DefaultRouter()
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'subtopics', SubtopicViewSet, basename='subtopic')
router.register(r'topics', SubtopicMasteryViewSet, basename='subtopic-mastery')

urlpatterns = router.urls
