from django.contrib import admin
from .models import Topic, Question, PracticeSheet, Submission, Answer, TopicMastery

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_module', 'description')
    search_fields = ('name', 'description')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'topic', 'tier', 'correct_answer_index')
    list_filter = ('topic', 'tier')
    search_fields = ('text', 'topic__name')

@admin.register(PracticeSheet)
class PracticeSheetAdmin(admin.ModelAdmin):
    list_display = ('id', 'total_xp')

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'sheet', 'submitted_at', 'time_taken')
    list_filter = ('submitted_at',)
    search_fields = ('student__user__username',)

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'submission', 'question', 'selected_answer_index', 'confidence')

@admin.register(TopicMastery)
class TopicMasteryAdmin(admin.ModelAdmin):
    list_display = ('student', 'topic', 'difficulty', 'stability', 'last_review_date')
    list_filter = ('topic', 'last_review_date')
    search_fields = ('student__user__username', 'topic__name')
