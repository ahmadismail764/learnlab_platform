from rest_framework import generics, permissions
from rest_framework.permissions import AllowAny
from accounts.models import User
from accounts.serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from topics.models import SubtopicMastery

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

