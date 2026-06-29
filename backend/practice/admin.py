from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from practice.models import Question, PracticeSession, QuestionResponse


class QuestionResponseInline(TabularInline):
    model = QuestionResponse
    extra = 0
    fields = ("question", "selected_answer_index", "written_answer", "is_correct", "answered_at", "time_taken_seconds", "confidence_rating")
    readonly_fields = ("is_correct", "answered_at")
    show_change_link = True


@admin.register(Question)
class QuestionAdmin(ModelAdmin):
    list_display = ("short_text", "subtopic", "topic_name", "question_type", "tier")
    list_filter = ("question_type", "tier", "subtopic__topic")
    search_fields = ("text", "subtopic__name", "subtopic__topic__name")
    autocomplete_fields = ("subtopic",)
    readonly_fields = ("id",)

    fieldsets = (
        (None, {"fields": ("id", "subtopic", "tier", "question_type", "grading_method")}),
        ("Question Content", {
            # MCQ uses choices + correct_answer_index; written uses correct_answer.
            "fields": ("text", "choices", "correct_answer_index", "correct_answer"),
            "classes": ["tab"],
        }),
    )

    @admin.display(description="Question")
    def short_text(self, obj):
        return obj.text[:80] + ("…" if len(obj.text) > 80 else "")

    @admin.display(description="Topic")
    def topic_name(self, obj):
        return obj.subtopic.topic.name if obj.subtopic else "-"


@admin.register(PracticeSession)
class PracticeSessionAdmin(ModelAdmin):
    list_display = (
        "learner", "start_time", "end_time",
        "total_xp_earned", "response_count", "is_complete",
    )
    list_filter = ("learner",)
    search_fields = ("learner__username", "learner__email")
    readonly_fields = ("id", "start_time", "total_xp_earned")
    autocomplete_fields = ("learner",)
    inlines = [QuestionResponseInline]

    fieldsets = (
        (None, {"fields": ("id", "learner")}),
        ("Timing", {
            "fields": ("start_time", "end_time"),
            "classes": ["tab"],
        }),
        ("Results", {
            "fields": ("total_xp_earned",),
            "classes": ["tab"],
        }),
    )

    @admin.display(description="Responses")
    def response_count(self, obj):
        return obj.responses.count()

    @admin.display(description="Complete", boolean=True)
    def is_complete(self, obj):
        return obj.end_time is not None


@admin.register(QuestionResponse)
class QuestionResponseAdmin(ModelAdmin):
    list_display = (
        "learner_name", "question_preview", "selected_answer_index",
        "written_answer", "is_correct", "confidence_rating", "time_taken_seconds",
    )
    list_filter = ("is_correct", "confidence_rating")
    search_fields = ("session__learner__username", "question__text")
    readonly_fields = ("id",)
    autocomplete_fields = ("session", "question")

    @admin.display(description="Learner")
    def learner_name(self, obj):
        return obj.session.learner.username

    @admin.display(description="Question")
    def question_preview(self, obj):
        return obj.question.text[:60] + ("…" if len(obj.question.text) > 60 else "")
