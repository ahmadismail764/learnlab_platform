from rest_framework import serializers
from accounts.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    # Make password write-only so it never gets returned in the JSON response
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User 
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user( # type: ignore
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class UserDetailSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'is_staff', 'joined_at', 'current_xp', 'streak_count', 
            'last_practice_date', 'role'
        ]
        read_only_fields = [
            'id', 'is_staff', 'joined_at', 'current_xp', 
            'streak_count', 'last_practice_date', 'role'
        ]

    def get_role(self, obj) -> str:
        return 'admin' if obj.is_staff else 'learner'

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = 'admin' if user.is_staff else 'learner'
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = getattr(user, 'first_name', '')
        token['last_name'] = getattr(user, 'last_name', '')
        token['is_staff'] = user.is_staff
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'is_staff': self.user.is_staff,
            'first_name': getattr(self.user, 'first_name', ''),
            'last_name': getattr(self.user, 'last_name', ''),
            'role': 'admin' if self.user.is_staff else 'learner',
        }
        return data

class LearnerProfileSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    total_xp = serializers.IntegerField(source='current_xp')

    class Meta:
        model = User
        fields = ['id', 'user', 'total_xp', 'streak_count', 'last_practice_date']

    def get_user(self, obj):
        return {
            'id': str(obj.id),
            'username': obj.username,
            'email': obj.email,
            'first_name': getattr(obj, 'first_name', ''),
            'last_name': getattr(obj, 'last_name', ''),
        }