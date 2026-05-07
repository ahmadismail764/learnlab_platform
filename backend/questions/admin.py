from django.contrib import admin
from .models import Topic, Subtopic, Question, PracticeSession, QuestionResponse, SubtopicMastery

admin.site.register(Topic)
admin.site.register(Subtopic)
admin.site.register(Question)
admin.site.register(PracticeSession)
admin.site.register(QuestionResponse)
admin.site.register(SubtopicMastery)

