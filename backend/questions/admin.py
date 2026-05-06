from django.contrib import admin
from .models import Topic, Subtopic, Question, PracticeSession, QuestionResponse, SubtopicMastery

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')

@admin.register(Subtopic)
class SubtopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'topic')
    list_filter = ('topic',)
    search_fields = ('name', 'topic__name')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'subtopic', 'tier', 'correct_answer_index')
    list_filter = ('subtopic', 'tier')
    search_fields = ('text', 'subtopic__name')

@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'learner', 'start_time', 'end_time', 'total_xp_earned')
    list_filter = ('start_time',)
    search_fields = ('learner__user__username',)

@admin.register(QuestionResponse)
class QuestionResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'question', 'is_correct', 'confidence_rating')
    list_filter = ('is_correct',)

@admin.register(SubtopicMastery)
class SubtopicMasteryAdmin(admin.ModelAdmin):
    list_display = ('learner', 'subtopic', 'state', 'difficulty', 'stability', 'reps', 'lapses')
    list_filter = ('subtopic', 'state')
    search_fields = ('learner__user__username', 'subtopic__name')
