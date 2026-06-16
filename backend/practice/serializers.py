# Framework imports
from rest_framework import serializers
from django.utils import timezone as django_timezone
# Our imports
from practice.models import Question, PracticeSession, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER
from practice.fsrs_engine import process_review
from accounts.models import User
from accounts.serializers import UserDetailSerializer


# ===================================================
# Leaderboard serializers
# ===================================================

class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'current_xp', 'streak_count']


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

class QuestionResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResponse
        fields = ['question', 'selected_answer_index']

# ===================================================
# PracticeSession serializers
# ===================================================
class PracticeSessionSerializer(serializers.ModelSerializer):
    learner = UserDetailSerializer(read_only=True)
    responses = QuestionResponseSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = ['id', 'learner', 'start_time', 'end_time', 'total_xp_earned', 'responses']

    def update(self, instance, validated_data):
    # Track if the session is being marked completed in this update
        already_completed = instance.end_time is not None
        # Perform the standard model update
        instance = super().update(instance, validated_data)

        # If the session is now completed, award XP to the learner once
        if instance.end_time is not None and not already_completed:
            learner = instance.learner

            # Calculate XP server-side from verified correct responses
            correct_responses = instance.responses.filter(is_correct=True).count()
            earned_xp = correct_responses * XP_PER_CORRECT_ANSWER
            learner.current_xp += earned_xp

            # Standard streak updates
            from django.utils import timezone as django_timezone
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

class PracticeSessionCreateSerializer(serializers.ModelSerializer):
    responses = QuestionResponseCreateSerializer(many=True, required=False)

    class Meta:
        model = PracticeSession
        fields = ['id', 'responses']

    def create(self, validated_data):
        responses_data = validated_data.pop('responses', [])
        session = PracticeSession.objects.create(**validated_data)

        correct_count = 0
        for response_data in responses_data:
            question = response_data['question']
            selected = response_data['selected_answer_index']
            is_correct = (selected == question.correct_answer_index)

            response = QuestionResponse.objects.create(
                session=session,
                is_correct=is_correct,
                **response_data
            )
            if response.is_correct:
                correct_count += 1
            process_review(session.learner, response.question.subtopic, response)

        # Store session total only; learner XP/streak are awarded in update() on completion.
        session.total_xp_earned = correct_count * XP_PER_CORRECT_ANSWER
        session.save()

        return session
