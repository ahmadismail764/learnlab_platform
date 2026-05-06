from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Learner, LearnerUser, AdminUser

User = get_user_model()


class LearnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = ['total_xp', 'streak_count', 'last_practice_date']


class DynamicUserSerializer(serializers.ModelSerializer):
    profile_data = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'is_staff', 'date_joined', 'profile_data']
        read_only_fields = ['id', 'role', 'is_staff', 'date_joined', 'profile_data']

    def get_profile_data(self, obj):
        if obj.role == 'learner' and hasattr(obj, 'learner_profile'):
            profile = obj.learner_profile
            return {
                'total_xp': profile.total_xp,
                'streak_count': profile.streak_count,
                'last_practice_date': profile.last_practice_date,
            }
        elif obj.role == 'admin' and hasattr(obj, 'admin_profile'):
            return {'is_admin': True}
        return None

class BaseRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

class LearnerRegisterSerializer(BaseRegisterSerializer):
    class Meta(BaseRegisterSerializer.Meta):
        model = LearnerUser

    def create(self, validated_data):
        return LearnerUser.objects.create_user(**validated_data)

class AdminRegisterSerializer(BaseRegisterSerializer):
    class Meta(BaseRegisterSerializer.Meta):
        model = AdminUser

    def create(self, validated_data):
        return AdminUser.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
