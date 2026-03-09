from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer, StudentSerializer
from .models import Student
from rest_framework.response import Response

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.student_profile

class LeaderboardView(generics.ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Student.objects.all().order_by('-total_xp')
