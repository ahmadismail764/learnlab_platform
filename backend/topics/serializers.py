import math
from datetime import datetime, timezone
# DRF imports
from rest_framework import serializers
# Our imports
from topics.models import Topic, Subtopic, SubtopicMastery
from accounts.models import User

# ===================================================
# Leaderboard serializers
# ===================================================

class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'current_xp', 'streak_count']

class TopicSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = ['id', 'name', 'description', 'question_count']

    id = serializers.UUIDField(read_only=True)

    def get_question_count(self, obj) -> int:
        from practice.models import Question
        return Question.objects.filter(subtopic__topic=obj).count()

class SubtopicSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Subtopic
        fields = ['id', 'topic', 'topic_name', 'name', 'description', 'question_count']

    def get_question_count(self, obj) -> int:
        return obj.questions.count()

class SubtopicMasterySerializer(serializers.ModelSerializer):
    topic = serializers.UUIDField(source='subtopic.topic.id', read_only=True)
    topic_name = serializers.CharField(source='subtopic.topic.name', read_only=True)
    rep_num = serializers.IntegerField(source='reps', read_only=True)
    memory = serializers.SerializerMethodField()
    speed = serializers.FloatField(source='stability', read_only=True)
    status = serializers.SerializerMethodField()
    last_reviewed = serializers.DateTimeField(source='last_review', read_only=True)
    next_due = serializers.DateTimeField(source='next_review', read_only=True)

    class Meta:
        model = SubtopicMastery
        fields = [
            'id', 'topic', 'topic_name', 'rep_num', 'memory', 'speed', 
            'difficulty', 'status', 'last_reviewed', 'next_due'
        ]
        read_only_fields = fields

    def get_memory(self, obj) -> float:
        if obj.stability is None or obj.stability <= 0 or obj.last_review is None:
            return 0.0

        now = datetime.now(timezone.utc)
        elapsed_days = (now - obj.last_review).total_seconds() / 86400
        return round(math.exp(math.log(0.9) * elapsed_days / obj.stability), 4)

    def get_status(self, obj) -> str:
        state_mapping = {
            'NEW': 'new',
            'LEARNING': 'learning',
            'REVIEW': 'learned',
            'RELEARNING': 'struggling',
        }
        return state_mapping.get(obj.state, 'new')
