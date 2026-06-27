from rest_framework.routers import DefaultRouter
from django.urls import path, include
from practice.views import (
    QuestionViewSet,
    PracticeSessionViewSet,
    ReviewForecastView,
    # QuestionResponseViewSet,
)

QuestionsRouter = DefaultRouter()
QuestionsRouter.register(r'questions', QuestionViewSet, basename='question')

PracticeSessionRouter = DefaultRouter()
PracticeSessionRouter.register(r'sessions', PracticeSessionViewSet, basename='session')

# ResponseRouter = DefaultRouter()
# ResponseRouter.register(r'responses', QuestionResponseViewSet, basename='response')

urlpatterns = [
    path('review-forecast/', ReviewForecastView.as_view(), name='review-forecast'),
    path('', include(QuestionsRouter.urls)),
    path('', include(PracticeSessionRouter.urls)),
#     path('', include(ResponseRouter.urls)),
]
