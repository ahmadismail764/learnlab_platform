from django.contrib import admin
from .models import Topic, Question, PracticeSession, SingleQuestionInteraction, TopicMastery

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_module', 'description')
    search_fields = ('name', 'description')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'topic', 'tier', 'correct_answer_index')
    list_filter = ('topic', 'tier')
    search_fields = ('text', 'topic__name')

@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'session_type', 'start_time', 'end_time', 'total_xp_earned')
    list_filter = ('session_type', 'start_time')
    search_fields = ('student__user__username',)

@admin.register(SingleQuestionInteraction)
class SingleQuestionInteractionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'question', 'is_correct', 'confidence_rating')

@admin.register(TopicMastery)
class TopicMasteryAdmin(admin.ModelAdmin):
    list_display = ('student', 'topic', 'difficulty', 'stability', 'last_review_date', 'next_review_date')
    list_filter = ('topic', 'last_review_date')
    search_fields = ('student__user__username', 'topic__name')
