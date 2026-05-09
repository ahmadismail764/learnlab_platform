from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import RegisterView
urlpatterns = [
    # auth endpoints provided by simplejwt
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),

    path('register/', RegisterView.as_view(), name='register-learner'),
    
    # path('users/me/', CurrentUserView.as_view()),
    # path('leaderboard/global/', GlobalLeaderboardView.as_view()),
    # path('leaderboard/topic/<uuid:topic_id>/', TopicLeaderboardView.as_view()),
]
