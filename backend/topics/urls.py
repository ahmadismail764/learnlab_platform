from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import RegisterLearnerView
from rest_framework.routers import DefaultRouter
from topics.views import TopicViewSet, SubtopicViewSet, SubtopicMasteryViewSet

router = DefaultRouter()
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'subtopics', SubtopicViewSet, basename='subtopic')
router.register(r'topics', SubtopicMasteryViewSet, basename='subtopic-mastery')

urlpatterns = [
    # auth endpoints provided by simplejwt
    path('topics/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),

    path('register/', RegisterLearnerView.as_view(), name='register-learner'),
    *router.urls,
    
    
    # path('users/me/', CurrentUserView.as_view()),
    # path('leaderboard/global/', GlobalLeaderboardView.as_view()),
    # path('leaderboard/topic/<uuid:topic_id>/', TopicLeaderboardView.as_view()),
]
