from rest_framework.routers import DefaultRouter
from django.urls import path, include
from practice.views import (
    QuestionViewSet, 
    PracticeSessionViewSet, 
    LearnerProfileListView, 
    LeaderboardView
)

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'sessions', PracticeSessionViewSet, basename='session')

urlpatterns = [
    path('learners/', LearnerProfileListView.as_view(), name='learner-list'),
    path('learners/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('', include(router.urls)),
]