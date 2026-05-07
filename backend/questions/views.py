from rest_framework import permissions, viewsets

# --- Models ---
# Importing models that represent the core domain entities for questions, topics, 
# and user practice sessions to be exposed via APIs.
from questions.models import  (
    Topic,
    Subtopic,
    Question,
    PracticeSession,
    QuestionResponse,
    SubtopicMastery
)

# --- Serializers ---
# Importing serializers to handle the conversion of complex model instances 
# into JSON representations and validate incoming data.
from .serializers import (
    QuestionResponseSerializer,
    PracticeSessionSerializer,
    QuestionCreateSerializer,
    QuestionSerializer,
    SubtopicMasterySerializer,
    SubtopicSerializer,
    TopicSerializer,
)

# class IsAdminOrReadOnly(permissions.BasePermission):
#     def has_permission(self, request, view):
#         if request.method in permissions.SAFE_METHODS:
#             return True
#         return request.user and request.user.is_staff


# --- ViewSets ---
# ViewSets handle the HTTP requests (GET, POST, PUT, DELETE) and map them 
# to the appropriate database operations using the configured querysets and serializers.

# Handles operations for Topics, prefetching related subtopics for optimization.
class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.prefetch_related('subtopics')
    serializer_class = TopicSerializer

# Handles operations for Subtopics (e.g., Algebra, Geometry).
class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.all()
    serializer_class = SubtopicSerializer

# Handles CRUD for Questions, prefetching related subtopic to avoid N+1 query issues.
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('subtopic')
    serializer_class = QuestionSerializer

# Manages practice sessions for users. Currently returns an empty queryset by default
# and usually requires overriding get_queryset() to filter by the requesting user.
class PracticeSessionViewSet(viewsets.ModelViewSet):
    queryset = PracticeSession.objects.none()
    serializer_class = PracticeSessionSerializer

# Handles logging and retrieving individual responses to questions during a practice session.
class QuestionResponseViewSet(viewsets.ModelViewSet):
    queryset = QuestionResponse.objects.all()
    serializer_class = QuestionResponseSerializer

# Tracks a user's mastery level for specific subtopics based on their performance.
class SubtopicMasteryViewSet(viewsets.ModelViewSet):
    queryset = SubtopicMastery.objects.all()
    serializer_class = SubtopicMasterySerializer
