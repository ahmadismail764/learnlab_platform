from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    TopicViewSet, 
    SubtopicViewSet,
    QuestionViewSet, 
    PracticeSessionViewSet, 
    SubtopicMasteryViewSet,
)

router = DefaultRouter()
# router.register('topics', TopicViewSet)
# router.register('subtopics', SubtopicViewSet)
# router.register('questions', QuestionViewSet)
# router.register('sessions', PracticeSessionViewSet, basename='practicesession')
# router.register('mastery', SubtopicMasteryViewSet, basename='subtopicmastery')
# router.register('interactions', InteractionViewSet, basename='interaction')

urlpatterns = [
    path('', include(router.urls)),
]
