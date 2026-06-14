from rest_framework.routers import DefaultRouter
from django.urls import path, include
from practice.views import (
    QuestionViewSet, 
    PracticeSessionViewSet,
    LeaderboardView,
    GenerateAdaptiveSessionView
)

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'sessions', PracticeSessionViewSet, basename='session')

urlpatterns = [
    path('sessions/generate-adaptive/', GenerateAdaptiveSessionView.as_view(), name='generate-adaptive'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('', include(router.urls)),
]