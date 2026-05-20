from rest_framework import permissions, viewsets, generics
from practice.models import Question, PracticeSession, QuestionResponse
from accounts.models import User
from accounts.serializers import LearnerProfileSerializer
from .serializers import (
    QuestionResponseSerializer, 
    PracticeSessionSerializer, 
    PracticeSessionCreateSerializer, 
    QuestionSerializer
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_all_questions(request):
    questions = Question.objects.prefetch_related('subtopic__topic')
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('subtopic__topic')
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]

class PracticeSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return PracticeSession.objects.none()
        if user.is_staff:
            return PracticeSession.objects.all().order_by('-start_time')
        return PracticeSession.objects.filter(learner=user).order_by('-start_time')

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    def perform_create(self, serializer):
        serializer.save(learner=self.request.user)

class LearnerProfileListView(generics.ListAPIView):
    serializer_class = LearnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_staff=False).order_by('-current_xp')

class LeaderboardView(generics.ListAPIView):
    serializer_class = LearnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.filter(is_staff=False)
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            # Filter distinct users having mastery under this topic
            queryset = queryset.filter(masteries__subtopic__topic_id=topic_id).distinct()
        
        return queryset.order_by('-current_xp')
