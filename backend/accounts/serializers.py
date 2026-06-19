from rest_framework import serializers
from accounts.models import User, AuditLog
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    # Make password write-only so it never gets returned in the JSON response
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User 
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class UserDetailSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    avatar_color = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_staff', 'date_joined', 'current_xp', 'streak_count', 
            'last_practice_date', 'role', 'initials', 'avatar_color'
        ]
        read_only_fields = [
            'id', 'is_staff', 'date_joined', 'current_xp',
            'streak_count', 'last_practice_date', 'role',
            'initials', 'avatar_color'
        ]

    def get_role(self, obj) -> str:
        return 'admin' if obj.is_staff else 'learner'

    def get_initials(self, obj) -> str:
        first = getattr(obj, 'first_name', '')
        last = getattr(obj, 'last_name', '')
        if first and last:
            return f"{first[0]}{last[0]}".upper()
        elif first:
            return first[0].upper()
        elif getattr(obj, 'username', ''):
            return obj.username[0].upper()
        return "??"

    def get_avatar_color(self, obj) -> str:
        import hashlib
        hash_val = int(hashlib.md5(str(obj.id).encode('utf-8')).hexdigest(), 16)
        hue = hash_val % 360
        return f"hsl({hue}, 70%, 50%)"

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['preferences']


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_username', 'action_type', 'target_resource', 'timestamp', 'metadata']
        read_only_fields = ['id', 'actor', 'actor_username', 'action_type', 'target_resource', 'timestamp', 'metadata']


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
        
        first = getattr(self.user, 'first_name', '')
        last = getattr(self.user, 'last_name', '')
        if first and last:
            initials = f"{first[0]}{last[0]}".upper()
        elif first:
            initials = first[0].upper()
        elif self.user.username: 
            initials = self.user.username[0].upper()
        else:
            initials = "??"
            
        import hashlib
        hash_val = int(hashlib.md5(str(self.user.id).encode('utf-8')).hexdigest(), 16)
        avatar_color = f"hsl({hash_val % 360}, 70%, 50%)"
        
        data['user'] = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'is_staff': self.user.is_staff,
            'first_name': first,
            'last_name': last,
            'role': 'admin' if self.user.is_staff else 'learner',
            'initials': initials,
            'avatar_color': avatar_color,
        }
        return data
