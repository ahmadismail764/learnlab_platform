from django.shortcuts import render
from rest_framework import viewsets
from topics.models import Topic, Subtopic, SubtopicMastery
from topics.serializers import TopicSerializer, SubtopicSerializer, SubtopicMasterySerializer
# Create your views here.
class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.prefetch_related('subtopics')
    serializer_class = TopicSerializer

# Handles operations for Subtopics (e.g., Algebra, Geometry).set
class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.all()
    serializer_class = SubtopicSerializer

class SubtopicMasteryViewSet(viewsets.ModelViewSet):
    queryset = SubtopicMastery.objects.all()
    serializer_class = SubtopicMasterySerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return SubtopicMastery.objects.all()
        return SubtopicMastery.objects.filter(learner=user)
