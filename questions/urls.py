from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import TopicViewSet, QuestionViewSet, PracticeSheetViewSet, SubmissionViewSet, TopicMasteryViewSet

router = DefaultRouter()
router.register('topics', TopicViewSet)
router.register('questions', QuestionViewSet)
router.register('practice-sheets', PracticeSheetViewSet, basename='practicesheet')
router.register('submissions', SubmissionViewSet, basename='submission')
router.register('mastery', TopicMasteryViewSet, basename='topicmastery')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
