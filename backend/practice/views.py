from rest_framework import permissions, viewsets
from practice.models import Question, PracticeSession, QuestionResponse
from .serializers import (
    QuestionResponseSerializer,
    PracticeSessionSerializer,
    QuestionCreateSerializer,
    QuestionSerializer,
)

# class IsAdminOrReadOnly(permissions.BasePermission):
#     def has_permission(self, request, view):
#         if request.method in permissions.SAFE_METHODS:
#             return True
#         return request.user and request.user.is_staff


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('subtopic')
    serializer_class = QuestionSerializer

class PracticeSessionViewSet(viewsets.ModelViewSet):
    queryset = PracticeSession.objects.none()
    serializer_class = PracticeSessionSerializer

class QuestionResponseViewSet(viewsets.ModelViewSet):
    queryset = QuestionResponse.objects.all()
    serializer_class = QuestionResponseSerializer

