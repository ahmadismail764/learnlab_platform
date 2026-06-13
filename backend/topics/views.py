from rest_framework import viewsets, permissions
from topics.models import Topic, Subtopic, SubtopicMastery
from topics.serializers import TopicSerializer, SubtopicSerializer, SubtopicMasterySerializer

"""
    The following three are viewsets that handle all CRUD operations for topics, subtopics, and subtopic mastery records.
    The mastery viewset is permission-protected to only allow access to the learner's own mastery records, 
    while the topic and subtopic viewsets are open to all authenticated users for browsing.
"""

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.prefetch_related('subtopics')
    serializer_class = TopicSerializer

class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.all()
    serializer_class = SubtopicSerializer

class SubtopicMasteryViewSet(viewsets.ModelViewSet):
    serializer_class = SubtopicMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return SubtopicMastery.objects.none()
        return SubtopicMastery.objects.filter(learner=user)
