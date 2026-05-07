from rest_framework import serializers
from .models import User, LearnerProfile

class LearnerSerializer(serializers.ModelSerializer):
    # Make password write-only so it never gets returned in the JSON response
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User 
        fields = ['username', 'email', 'password']


    def create(self, validated_data):
        user = User.objects.create_user( # type: ignore
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        LearnerProfile.objects.create(user=user)
        return user