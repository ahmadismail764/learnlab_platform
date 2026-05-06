from rest_framework import serializers
from .models import Topic, Subtopic, Question, PracticeSession, QuestionResponse, SubtopicMastery
from users.serializers import LearnerSerializer
import math
from datetime import datetime, timezone

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name', 'description']

class SubtopicSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Subtopic
        fields = ['id', 'topic', 'topic_name', 'name', 'description', 'question_count']

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
        fields = ['id', 'question', 'is_correct', 'time_taken_seconds', 'confidence_rating']

class PracticeSessionSerializer(serializers.ModelSerializer):
    learner = LearnerSerializer(read_only=True)
    responses = QuestionResponseSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = ['id', 'learner', 'start_time', 'end_time', 'total_xp_earned', 'responses']

class QuestionResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResponse
        fields = ['question', 'is_correct', 'time_taken_seconds', 'confidence_rating']

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

class SubtopicMasterySerializer(serializers.ModelSerializer):
    retrievability = serializers.SerializerMethodField()
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)

    class Meta:
        model = SubtopicMastery
        fields = ['id', 'learner', 'subtopic', 'subtopic_name', 'difficulty', 'stability', 'reps', 'lapses', 'state', 'last_review', 'next_review', 'retrievability']
        read_only_fields = ['learner', 'subtopic', 'difficulty', 'stability', 'reps', 'lapses', 'last_review', 'retrievability']

    def get_retrievability(self, obj) -> float:
        if obj.stability is None or obj.last_review is None:
            return 0.0

        now = datetime.now(timezone.utc)
        elapsed_days = (now - obj.last_review).total_seconds() / 86400
        return round(math.exp(math.log(0.9) * elapsed_days / obj.stability), 4)

class InteractionPayloadSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    is_correct = serializers.BooleanField()
    session_id = serializers.UUIDField()
    confidence_rating = serializers.IntegerField(required=False, default=3)
    time_taken_seconds = serializers.FloatField(required=False, default=0.0)
