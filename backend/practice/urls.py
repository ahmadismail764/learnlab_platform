from rest_framework.routers import DefaultRouter
from django.urls import path, include
from practice.views import (
    QuestionViewSet,
    PracticeSessionViewSet,
    QuestionResponseViewSet,
    GenerateAdaptiveSessionView,
)

QuestionsRouter = DefaultRouter()
QuestionsRouter.register(r'questions', QuestionViewSet, basename='question')

PracticeSessionRouter = DefaultRouter()
PracticeSessionRouter.register(r'sessions', PracticeSessionViewSet, basename='session')

# ResponseRouter = DefaultRouter()
# ResponseRouter.register(r'responses', QuestionResponseViewSet, basename='response')

urlpatterns = [
    path('sessions/generate-adaptive/', GenerateAdaptiveSessionView.as_view(), name='generate-adaptive'),
    path('', include(QuestionsRouter.urls)),
    path('', include(PracticeSessionRouter.urls)),
#     path('', include(ResponseRouter.urls)),
]
