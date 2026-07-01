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

# ===================================================
# Enrollment serializers (backed by SubtopicMastery)
# ===================================================
class EnrollmentSerializer(serializers.ModelSerializer):
    """Read serializer for /enrollments/ — an enrolled subtopic + its FSRS snapshot.

    Reads straight off SubtopicMastery, whose existence *is* the enrollment.
    Enrollment-focused shape (lighter than SubtopicMasterySerializer, which is
    the full progress-dashboard view).
    """
    topic = serializers.UUIDField(source='subtopic.topic_id', read_only=True)
    topic_name = serializers.CharField(source='subtopic.topic.name', read_only=True)
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)
    mastery_state = serializers.CharField(source='state', read_only=True)

    class Meta:
        model = SubtopicMastery
        fields = [
            'id', 'subtopic', 'subtopic_name', 'topic', 'topic_name',
            'mastery_state', 'next_review',
        ]
        read_only_fields = fields


class EnrollmentCreateSerializer(serializers.Serializer):
    """Write serializer for POST /enrollments/ — the frontend sends one field."""
    subtopic = serializers.PrimaryKeyRelatedField(queryset=Subtopic.objects.all())


class SubtopicMasterySerializer(serializers.ModelSerializer):
    topic = serializers.UUIDField(source='subtopic.topic.id', read_only=True)
    topic_name = serializers.CharField(source='subtopic.topic.name', read_only=True)
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)
    memory = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = SubtopicMastery
        fields = [
            'id', 'topic', 'topic_name', 'subtopic', 'subtopic_name',
            'reps', 'memory', 'stability', 'difficulty', 'status',
            'last_review', 'next_review'
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