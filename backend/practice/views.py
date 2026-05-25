from rest_framework import permissions, viewsets
from practice.models import Question, PracticeSession, QuestionResponse
from .serializers import QuestionResponseSerializer, PracticeSessionSerializer, QuestionCreateSerializer, QuestionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

# class IsAdminOrReadOnly(permissions.BasePermission):
#     def has_permission(self, request, view):
#         if request.method in permissions.SAFE_METHODS:
#             return True
#         return request.user and request.user.is_staff

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_all_questions(request):
    questions = Question.objects.prefetch_related('subtopic__topic')
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('subtopic')
    serializer_class = QuestionSerializer

class PracticeSessionViewSet(viewsets.ModelViewSet):
    queryset = PracticeSession.objects.all()
    serializer_class = PracticeSessionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PracticeSession.objects.all()
        return PracticeSession.objects.filter(learner=user)

class QuestionResponseViewSet(viewsets.ModelViewSet):
    queryset = QuestionResponse.objects.all()
    serializer_class = QuestionResponseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return QuestionResponse.objects.all()
        return QuestionResponse.objects.filter(session__learner=user)

