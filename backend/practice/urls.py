from rest_framework.routers import DefaultRouter
from django.urls import path, include
from practice.views import (
    QuestionViewSet, 
    PracticeSessionViewSet,
    # LeaderboardView,
    GenerateAdaptiveSessionView,
    get_all_questions
)

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'sessions', PracticeSessionViewSet, basename='session')

urlpatterns = [
    # path('learners/', LearnerProfileListView.as_view(), name='learner-list'),
    # path('learners/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('questions-test/', get_all_questions, name='get-all-questions'),
    path('sessions/generate-adaptive/', GenerateAdaptiveSessionView.as_view(), name='generate-adaptive'),
    path('', include(router.urls)),
]