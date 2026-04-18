from django.contrib import admin
from .models import Topic, Question, PracticeSession, SingleQuestionInteraction, TopicMastery, KnowledgePoint

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_module', 'description')
    search_fields = ('name', 'description')

@admin.register(KnowledgePoint)
class KnowledgePointAdmin(admin.ModelAdmin):
    list_display = ('name', 'topic')
    list_filter = ('topic',)
    search_fields = ('name', 'topic__name')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'knowledge_point', 'tier', 'correct_answer_index')
    list_filter = ('knowledge_point', 'tier')
    search_fields = ('text', 'knowledge_point__topic__name', 'knowledge_point__name')

@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'learner', 'session_type', 'start_time', 'end_time', 'total_xp_earned')
    list_filter = ('session_type', 'start_time')
    search_fields = ('learner__user__username',)

@admin.register(SingleQuestionInteraction)
class SingleQuestionInteractionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'question', 'is_correct', 'confidence_rating')

@admin.register(TopicMastery)
class TopicMasteryAdmin(admin.ModelAdmin):
    list_display = ('learner', 'topic', 'difficulty', 'stability', 'last_review_date', 'next_review_date')
    list_filter = ('topic', 'last_review_date')
    search_fields = ('learner__user__username', 'topic__name')
