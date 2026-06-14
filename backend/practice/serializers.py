# Framework imports
from rest_framework import serializers
from django.utils import timezone as django_timezone
# Our imports
from practice.models import Question, PracticeSession, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER
from accounts.serializers import UserDetailSerializer
from practice.fsrs_engine import process_review

# ===================================================
# Question serializers
# ===================================================
class QuestionSerializer(serializers.ModelSerializer):
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'subtopic', 'text', 'choices', 'tier']

class QuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'subtopic', 'text', 'choices', 'correct_answer_index', 'tier']

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
            # validating the user's answers
            is_correct = (selected == question.correct_answer_index)
            
            corrected_response = QuestionResponse.objects.create(
                session=session,
                is_correct=is_correct,
                **response_data
            )
            if corrected_response.is_correct:
                correct_count += 1
            process_review(session.learner, corrected_response.question.subtopic, corrected_response)
        
        # Calculate and award XP (10 XP per correct response)
        xp_earned = correct_count * XP_PER_CORRECT_ANSWER
        session.total_xp_earned = xp_earned
        session.save()
        
        # Update learner's XP
        learner = session.learner
        learner.current_xp += xp_earned
        
        # Update streak
        today = django_timezone.localdate()
        if learner.last_practice_date is None:
            learner.streak_count = 1
        elif learner.last_practice_date == today - django_timezone.timedelta(days=1):
            learner.streak_count += 1
        elif learner.last_practice_date < today - django_timezone.timedelta(days=1):
            learner.streak_count = 1
        # if last_practice_date == today, streak doesn't change
        
        learner.last_practice_date = today
        learner.save()
        
        return session
