from rest_framework import generics
from rest_framework.permissions import AllowAny
from accounts.models import User
from accounts.serializers import LearnerSerializer

class RegisterLearnerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = LearnerSerializer
    permission_classes = [AllowAny]

# class LearnerRegisterView(generics.CreateAPIView):
#     serializer_class = LearnerRegisterSerializer
#     permission_classes = [permissions.AllowAny]

# class AdminRegisterView(generics.CreateAPIView):
#     serializer_class = AdminRegisterSerializer
#     permission_classes = [permissions.IsAdminUser]

# class CurrentUserView(generics.RetrieveUpdateAPIView):
#     serializer_class = DynamicUserSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_object(self):
#         return self.request.user

# class GlobalLeaderboardView(generics.ListAPIView):
#     serializer_class = DynamicUserSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_queryset(self):
#         return LearnerUser.objects.select_related('learner_profile').all().order_by('-learner_profile__total_xp')[:10]

# class TopicLeaderboardView(generics.ListAPIView):
#     serializer_class = DynamicUserSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         subtopic_id = self.kwargs.get('topic_id')
#         top_learner_ids = list(
#             SubtopicMastery.objects.filter(subtopic_id=subtopic_id)
#             .order_by('-stability')
#             .values_list('learner_id', flat=True)[:10]
#         )
#         return LearnerUser.objects.filter(learner_profile__id__in=top_learner_ids).select_related('learner_profile')
