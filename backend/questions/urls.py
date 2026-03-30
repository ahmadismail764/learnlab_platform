from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import TopicViewSet, QuestionViewSet, PracticeSessionViewSet, TopicMasteryViewSet

router = DefaultRouter()
router.register('topics', TopicViewSet)
router.register('questions', QuestionViewSet)
router.register('sessions', PracticeSessionViewSet, basename='practicesession')
router.register('mastery', TopicMasteryViewSet, basename='topicmastery')

urlpatterns = [
    path('', include(router.urls)),
]
