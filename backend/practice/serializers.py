from rest_framework import serializers
from practice.models import Question, PracticeSession, QuestionResponse
from accounts.serializers import UserSerializer
import math
from datetime import datetime, timezone



class QuestionSerializer(serializers.ModelSerializer):
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'subtopic', 'subtopic_name', 'text', 'choices', 'correct_answer_index', 'tier']

class QuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'subtopic', 'text', 'choices', 'correct_answer_index', 'tier']

class QuestionResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResponse
        fields = ['id', 'question', 'is_correct']

class PracticeSessionSerializer(serializers.ModelSerializer):
    learner = UserSerializer(read_only=True)
    responses = QuestionResponseSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = ['id', 'learner', 'start_time', 'end_time', 'total_xp_earned', 'responses']

class QuestionResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResponse
        fields = ['question', 'is_correct']

class PracticeSessionCreateSerializer(serializers.ModelSerializer):
    responses = QuestionResponseCreateSerializer(many=True, required=False)

    class Meta:
        model = PracticeSession
        fields = ['responses']

    def create(self, validated_data):
        responses_data = validated_data.pop('responses', [])
        session = PracticeSession.objects.create(**validated_data)
        for response_data in responses_data:
            QuestionResponse.objects.create(session=session, **response_data)
        return session

