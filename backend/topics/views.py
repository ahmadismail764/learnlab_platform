from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
from topics.models import Topic, Subtopic, SubtopicMastery
from topics.serializers import (
    LeaderboardSerializer,
    TopicSerializer,
    SubtopicSerializer,
    SubtopicMasterySerializer,
)

User = get_user_model()

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
@extend_schema_view(
    list=extend_schema(
        operation_id='practice_leaderboard_list',
        description="Returns all learners ranked by XP descending. Staff accounts are excluded. Filter by ?topic=<uuid> to rank only learners active in that topic.",
        parameters=[
            OpenApiParameter(name='topic', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False),
        ],
        responses={200: LeaderboardSerializer(many=True)},
    )
)
class LeaderboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        topic_id = self.request.query_params.get('topic')
        qs = User.objects.filter(is_staff=False).order_by('-current_xp')
        if topic_id:
            from topics.models import SubtopicMastery
            learner_ids = SubtopicMastery.objects.filter(
                subtopic__topic_id=topic_id
            ).values_list('learner_id', flat=True).distinct()
            qs = qs.filter(id__in=learner_ids)
        return qs