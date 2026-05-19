from django.shortcuts import render
from rest_framework import viewsets
from topics.models import Topic, Subtopic, SubtopicMastery
from topics.serializers import TopicSerializer, SubtopicSerializer, SubtopicMasterySerializer
# Create your views here.
class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.prefetch_related('subtopics')
    serializer_class = TopicSerializer

# Handles operations for Subtopics (e.g., Algebra, Geometry).
class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.all()
    serializer_class = SubtopicSerializer

# Tracks a user's mastery level for specific subtopics based on their performance.
class SubtopicMasteryViewSet(viewsets.ModelViewSet):
    queryset = SubtopicMastery.objects.all()
    serializer_class = SubtopicMasterySerializer
