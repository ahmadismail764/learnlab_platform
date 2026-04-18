from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer, LearnerSerializer
from .models import Learner
from questions.models import TopicMastery
from rest_framework.response import Response

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class LearnerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.learner_profile

class GlobalLeaderboardView(generics.ListAPIView):
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Learner.objects.all().order_by('-total_xp')[:10]

class TopicLeaderboardView(generics.ListAPIView):
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        topic_id = self.kwargs.get('topic_id')
        # Query TopicMastery for the given topic, order by stability descending, limit to 10
        # Then extract the Learner objects
        masteries = TopicMastery.objects.filter(topic_id=topic_id).select_related('learner').order_by('-stability')[:10]
        # Since generics.ListAPIView iterates over the queryset to serialize, we can just return a list of learners
        return [m.learner for m in masteries]
