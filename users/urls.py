from django.urls import path
from .views import RegisterView, CurrentUserView, StudentProfileView, LeaderboardView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/v1/auth/register/', RegisterView.as_view()),
    path('api/v1/auth/login/', TokenObtainPairView.as_view()),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view()),
    path('api/v1/users/me/', CurrentUserView.as_view()),
    path('api/v1/students/me/', StudentProfileView.as_view()),
    path('api/v1/leaderboard/', LeaderboardView.as_view()),
]
