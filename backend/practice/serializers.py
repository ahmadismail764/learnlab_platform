# Core django imports
from django.utils import timezone as django_timezone
# DRF imports
from rest_framework import serializers
# Our imports
from practice.models import Question, PracticeSession, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER
from practice.fsrs_engine import process_session
from accounts.models import User
from accounts.serializers import UserDetailSerializer


# ===================================================
# Question serializers
# ===================================================
class QuestionSerializer(serializers.ModelSerializer):
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)
    # Expose the human-readable string version of the tier (Concept, Application, Synthesis)
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)

    class Meta:
        model = Question
        # EXCLUDE correct_answer_index completely so students can't cheat via dev tools
        fields = ['id', 'subtopic', 'subtopic_name', 'text', 'choices', 'tier', 'tier_display']
        read_only_fields = ['id']

class QuestionAdminSerializer(serializers.ModelSerializer):
    """Read serializer for staff — includes correct_answer_index."""
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'subtopic', 'subtopic_name', 'text', 'choices', 'correct_answer_index', 'tier', 'tier_display']
        read_only_fields = ['id']

class QuestionCreateAndUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'subtopic', 'text', 'choices', 'correct_answer_index', 'tier']
        read_only_fields = ['id']

# ===================================================
# QuestionResponse serializers
# ===================================================

class QuestionResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResponse
        fields = ['id', 'question', 'is_correct']
class QuestionResponseFeedbackSerializer(serializers.ModelSerializer):
    """Post-submit serializer: reveals correct_answer_index for the just-answered question only."""
    correct_answer_index = serializers.IntegerField(source='question.correct_answer_index', read_only=True)

    class Meta:
        model = QuestionResponse
        fields = ['id', 'question', 'selected_answer_index', 'is_correct', 'correct_answer_index', 'confidence_rating']
        read_only_fields = ['id', 'is_correct', 'correct_answer_index']

class AnswerSubmitSerializer(serializers.Serializer):
    selected_answer_index = serializers.IntegerField(min_value=0)
    confidence_rating = serializers.IntegerField(min_value=1, max_value=5, required=False)

# ===================================================
# PracticeSession serializers
# ===================================================
class PracticeSessionSerializer(serializers.ModelSerializer):
    learner = UserDetailSerializer(read_only=True)
    responses = QuestionResponseSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = ['id', 'learner', 'start_time', 'end_time', 'total_xp_earned', 'responses']

    # FSRS runs only when the end-time is used
    def update(self, instance, validated_data):
        already_completed = instance.end_time is not None
        instance = super().update(instance, validated_data)

        if instance.end_time is not None and not already_completed:
            if 'end_time' in validated_data:
                validated_data['end_time'] = django_timezone.now()
            process_session(instance.learner, session=instance)
            learner = instance.learner
            learner.current_xp += instance.total_xp_earned

            today = django_timezone.localdate()
            if learner.last_practice_date is None:
                learner.streak_count = 1
            elif learner.last_practice_date == today - django_timezone.timedelta(days=1):
                learner.streak_count += 1
            elif learner.last_practice_date < today - django_timezone.timedelta(days=1):
                learner.streak_count = 1

            learner.last_practice_date = today
            learner.save()

        return instance

