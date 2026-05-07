from django.contrib import admin
from practice.models import Question, PracticeSession, QuestionResponse

admin.site.register(Question)
admin.site.register(PracticeSession)
admin.site.register(QuestionResponse)

