from rest_framework import serializers
from .models import Topic, Question, PracticeSheet, Submission, Answer, TopicMastery
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
        fields = ['id', 'topic', 'topic_name', 'text', 'choices', 'correct_answer_index', 'tier']

class QuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'topic', 'text', 'choices', 'correct_answer_index', 'tier']

class PracticeSheetSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSheet
        fields = ['id', 'questions', 'total_xp']

class AnswerSerializer(serializers.ModelSerializer):
    is_correct = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ['id', 'question', 'selected_answer_index', 'confidence', 'is_correct']

    def get_is_correct(self, obj):
        return obj.selected_answer_index == obj.question.correct_answer_index

class SubmissionSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'student', 'sheet', 'answers', 'time_taken', 'submitted_at']

class AnswerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['question', 'selected_answer_index', 'confidence']

class SubmissionCreateSerializer(serializers.ModelSerializer):
    answers = AnswerCreateSerializer(many=True)

    class Meta:
        model = Submission
        fields = ['sheet', 'time_taken', 'answers']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        submission = Submission.objects.create(**validated_data)
        for answer_data in answers_data:
            Answer.objects.create(submission=submission, **answer_data)
        return submission

class TopicMasterySerializer(serializers.ModelSerializer):
    retrievability = serializers.SerializerMethodField()
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = TopicMastery
        fields = ['id', 'student', 'topic', 'topic_name', 'difficulty', 'stability', 'last_review_date', 'retrievability']
        read_only_fields = ['student', 'topic', 'difficulty', 'stability', 'last_review_date', 'retrievability']

    def get_retrievability(self, obj):
        if obj.stability <= 0:
            return 0.0

        # Calculate elapsed days
        now = datetime.now(timezone.utc)
        elapsed_days = (now - obj.last_review_date).total_seconds() / 86400

        # R = e^(elapsed_days / stability * ln(0.9))
        return math.exp(elapsed_days / obj.stability * math.log(0.9))
