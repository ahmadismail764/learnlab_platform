from django.contrib import admin
from topics.models import Topic, Subtopic, SubtopicMastery

admin.site.register(Topic)
admin.site.register(Subtopic)
admin.site.register(SubtopicMastery)
