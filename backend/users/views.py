from rest_framework import generics, permissions
from .serializers import LearnerRegisterSerializer, AdminRegisterSerializer, UserSerializer, LearnerSerializer, AdminProfileSerializer
from .models import Learner, AdminProfile
from questions.models import TopicMastery
from rest_framework.response import Response

class LearnerRegisterView(generics.CreateAPIView):
    serializer_class = LearnerRegisterSerializer
    permission_classes = [permissions.AllowAny]

class AdminRegisterView(generics.CreateAPIView):
    serializer_class = AdminRegisterSerializer
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
        try:
            return self.request.user.learner_profile
        except Learner.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("No learner profile found for this user.")

class AdminProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return self.request.user.admin_profile
        except AdminProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("No admin profile found for this user.")

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
        top_learner_ids = list(
            TopicMastery.objects.filter(topic_id=topic_id)
            .order_by('-mastery_level')
            .values_list('learner_id', flat=True)[:10]
        )
        return Learner.objects.filter(id__in=top_learner_ids).select_related('user')
