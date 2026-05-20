from rest_framework import serializers
from practice.models import Question, PracticeSession, QuestionResponse
from accounts.serializers import UserDetailSerializer
import math
from datetime import datetime, timezone
from django.utils import timezone as django_timezone

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
    learner = UserDetailSerializer(read_only=True)
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
        
        correct_count = 0
        for response_data in responses_data:
            response = QuestionResponse.objects.create(session=session, **response_data)
            if response.is_correct:
                correct_count += 1
            
            # Call FSRS process_review to update subtopic mastery
            from practice.fsrs_engine import process_review
            process_review(session.learner, response.question.subtopic, response)
        
        # Calculate and award XP (10 XP per correct response)
        xp_earned = correct_count * 10
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
