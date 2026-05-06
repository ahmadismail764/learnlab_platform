from rest_framework import serializers
from .models import Topic, Question, PracticeSession, SingleQuestionInteraction, TopicMastery
from users.serializers import LearnerSerializer
import math
from datetime import datetime, timezone

class TopicSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'name', 'description', 'parent_module', 'question_count']

class QuestionSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    id = serializers.UUIDField(source='topic.id', read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'topic', 'topic_name', 'text', 'choices', 'correct_answer_index', 'tier']

class QuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'topic', 'text', 'choices', 'correct_answer_index', 'tier']

class SingleQuestionInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SingleQuestionInteraction
        fields = ['id', 'question', 'user_response', 'is_correct', 'time_taken_seconds', 'confidence_rating']

class PracticeSessionSerializer(serializers.ModelSerializer):
    learner = LearnerSerializer(read_only=True)
    interactions = SingleQuestionInteractionSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = ['id', 'learner', 'session_type', 'start_time', 'end_time', 'total_xp_earned', 'interactions']

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
        fields = ['id', 'learner', 'topic', 'topic_name', 'difficulty', 'stability', 'reps', 'state', 'last_review', 'next_review', 'retrievability']
        read_only_fields = ['learner', 'topic', 'difficulty', 'stability', 'reps', 'last_review', 'retrievability']

    def get_retrievability(self, obj) -> float:
        if obj.stability is None or obj.last_review is None:
            return 0.0

        now = datetime.now(timezone.utc)
        elapsed_days = (now - obj.last_review).total_seconds() / 86400
        return round(math.exp(math.log(0.9) * elapsed_days / obj.stability), 4)

class InteractionPayloadSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    is_correct = serializers.BooleanField()
    session_id = serializers.IntegerField()
