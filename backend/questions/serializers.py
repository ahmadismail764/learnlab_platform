from rest_framework import serializers
from .models import Topic, Question, PracticeSession, SingleQuestionInteraction, TopicMastery
from users.serializers import StudentSerializer
import math
from datetime import datetime, timezone

class TopicSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'name', 'description', 'parent_module', 'question_count']

class QuestionSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'topic', 'topic_name', 'text', 'choices', 'correct_answer_index', 'tier', 'explanation_video_url']

class QuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'topic', 'text', 'choices', 'correct_answer_index', 'tier', 'explanation_video_url']

class SingleQuestionInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SingleQuestionInteraction
        fields = ['id', 'question', 'user_response', 'is_correct', 'time_taken_seconds', 'confidence_rating']

class PracticeSessionSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    interactions = SingleQuestionInteractionSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = ['id', 'student', 'session_type', 'start_time', 'end_time', 'total_xp_earned', 'interactions']

class SingleQuestionInteractionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SingleQuestionInteraction
        fields = ['question', 'user_response', 'is_correct', 'time_taken_seconds', 'confidence_rating']

class PracticeSessionCreateSerializer(serializers.ModelSerializer):
    interactions = SingleQuestionInteractionCreateSerializer(many=True)

    class Meta:
        model = PracticeSession
        fields = ['session_type', 'interactions']

    def create(self, validated_data):
        interactions_data = validated_data.pop('interactions', [])
        session = PracticeSession.objects.create(**validated_data)
        for interaction_data in interactions_data:
            SingleQuestionInteraction.objects.create(session=session, **interaction_data)
        return session

class TopicMasterySerializer(serializers.ModelSerializer):
    retrievability = serializers.SerializerMethodField()
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = TopicMastery
        fields = ['id', 'student', 'topic', 'topic_name', 'difficulty', 'stability', 'last_review_date', 'next_review_date', 'retrievability']
        read_only_fields = ['student', 'topic', 'difficulty', 'stability', 'last_review_date', 'retrievability']

    def get_retrievability(self, obj):
        if obj.stability <= 0:
            return 0.0

        now = datetime.now(timezone.utc)
        elapsed_days = (now - obj.last_review_date).total_seconds() / 86400
        return math.exp(elapsed_days / obj.stability * math.log(0.9))
