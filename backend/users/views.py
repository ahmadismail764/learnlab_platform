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
        # Safely handle users without a learner profile (e.g., admins)
        try:
            return self.request.user.learner_profile
        except Learner.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("No learner profile found for this user.")

class GlobalLeaderboardView(generics.ListAPIView):
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Learner.objects.select_related('user').all().order_by('-total_xp')[:10]

class TopicLeaderboardView(generics.ListAPIView):
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        topic_id = self.kwargs.get('topic_id')
        # Get learner IDs from TopicMastery, ordered by stability, then return
        # a proper QuerySet (not a list) to preserve DRF pagination support.
        top_learner_ids = list(
            TopicMastery.objects.filter(topic_id=topic_id)
            .order_by('-stability')
            .values_list('learner_id', flat=True)[:10]
        )
        return Learner.objects.filter(id__in=top_learner_ids).select_related('user')
