from django.urls import path
from .views import LearnerRegisterView, AdminRegisterView, CurrentUserView, GlobalLeaderboardView, TopicLeaderboardView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),

    path('learner/register/', LearnerRegisterView.as_view()),
    path('admin/register/', AdminRegisterView.as_view()),
    
    path('users/me/', CurrentUserView.as_view()),
    path('learner/me/', CurrentUserView.as_view()),
    path('admin/me/', CurrentUserView.as_view()),
    
    path('leaderboard/global/', GlobalLeaderboardView.as_view()),
    path('leaderboard/topic/<int:topic_id>/', TopicLeaderboardView.as_view()),
]
