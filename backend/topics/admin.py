from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from topics.models import Topic, Subtopic, SubtopicMastery


class SubtopicInline(TabularInline):
    model = Subtopic
    extra = 0
    fields = ("name", "description")
    show_change_link = True


@admin.register(Topic)
class TopicAdmin(ModelAdmin):
    list_display = ("name", "subtopic_count", "description")
    search_fields = ("name", "description")
    inlines = [SubtopicInline]

    @admin.display(description="Subtopics")
    def subtopic_count(self, obj):
        return obj.subtopics.count()


@admin.register(Subtopic)
class SubtopicAdmin(ModelAdmin):
    list_display = ("name", "topic", "question_count", "description")
    list_filter = ("topic",)
    search_fields = ("name", "topic__name")
    autocomplete_fields = ("topic",)

    @admin.display(description="Questions")
    def question_count(self, obj):
        return obj.questions.count()


@admin.register(SubtopicMastery)
class SubtopicMasteryAdmin(ModelAdmin):
    list_display = (
        "learner", "subtopic", "state",
        "reps", "lapses", "difficulty", "stability",
        "last_review", "next_review",
    )
    list_filter = ("state", "subtopic__topic")
    search_fields = ("learner__username", "subtopic__name")
    readonly_fields = ("id",)
    autocomplete_fields = ("learner", "subtopic")

    fieldsets = (
        (None, {"fields": ("id", "learner", "subtopic", "state")}),
        ("FSRS Parameters", {
            "fields": ("difficulty", "stability", "reps", "lapses"),
            "classes": ["tab"],
        }),
        ("Schedule", {
            "fields": ("last_review", "next_review"),
            "classes": ["tab"],
        }),
    )
