from rest_framework import viewsets, permissions
from topics.models import Topic, Subtopic, SubtopicMastery
from topics.serializers import TopicSerializer, SubtopicSerializer, SubtopicMasterySerializer

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.prefetch_related('subtopics')
    serializer_class = TopicSerializer

# Handles operations for Subtopics (e.g., Algebra, Geometry).set
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
