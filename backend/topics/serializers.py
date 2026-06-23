# DRF imports
from rest_framework import serializers
# Our imports
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.fsrs_engine import calculate_retention
from accounts.models import User

# ===================================================
# Leaderboard serializers
# ===================================================

class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'current_xp', 'streak_count']
        
# ===================================================
# Topic, Subtopic, SubtopicMastery serializers
# ===================================================    

class TopicSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'name', 'description', 'question_count']

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
    memory = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = SubtopicMastery
        fields = [
            'id', 'topic', 'topic_name', 'reps', 'memory',
            'stability', 'difficulty', 'status', 'last_review', 'next_review'
        ]
        read_only_fields = fields

    def get_memory(self, obj) -> float:
        return calculate_retention(obj.stability, obj.last_review)

    def get_status(self, obj) -> str:
        state_mapping = {
            'NEW': 'new',
            'LEARNING': 'learning',
            'REVIEW': 'learned',
            'RELEARNING': 'struggling',
        }
        return state_mapping.get(obj.state, 'new')