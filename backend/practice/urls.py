from rest_framework.routers import DefaultRouter
from django.urls import path
from practice.views import QuestionViewSet, PracticeSessionViewSet, get_all_questions

urlpatterns = [
    path('questions/', get_all_questions, name='question-list')
]