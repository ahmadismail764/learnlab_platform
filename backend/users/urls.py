from django.urls import path
from .views import RegisterView, CurrentUserView, StudentProfileView, LeaderboardView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('users/me/', CurrentUserView.as_view()),
    path('students/me/', StudentProfileView.as_view()),
    path('leaderboard/', LeaderboardView.as_view()),
]
