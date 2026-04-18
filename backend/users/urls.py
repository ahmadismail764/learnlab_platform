from django.urls import path
from .views import RegisterView, CurrentUserView, LearnerProfileView, GlobalLeaderboardView, TopicLeaderboardView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),

    path('register/', RegisterView.as_view()),
    path('users/me/', CurrentUserView.as_view()),
    path('learners/me/', LearnerProfileView.as_view()),
    path('leaderboard/global/', GlobalLeaderboardView.as_view()),
    path('leaderboard/topic/<int:topic_id>/', TopicLeaderboardView.as_view()),
]
