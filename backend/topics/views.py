# Core django imports
from django.db.models import Count
# DRF imports
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
# Our imports
from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from topics.services import extract_questions_from_pdf_stream, GeminiNotConfiguredError
import threading
import logging
from django.db import close_old_connections

logger = logging.getLogger(__name__)

def _background_extract(pdf_bytes, num_questions):
    try:
        extract_questions_from_pdf_stream(pdf_bytes, num_questions=num_questions)
    except Exception as e:
        logger.error(f"Background extraction failed: {e}", exc_info=True)
    finally:
        close_old_connections()
from topics.serializers import (
    LeaderboardSerializer,
    TopicSerializer,
    SubtopicSerializer,
    SubtopicMasterySerializer,
    EnrollmentSerializer,
    EnrollmentCreateSerializer,
)

"""
    The following three are viewsets that handle all CRUD operations for topics, subtopics, and subtopic mastery records.
    The mastery viewset is permission-protected to only allow access to the learner's own mastery records, 
    while the topic and subtopic viewsets are open to all authenticated users for browsing.
"""
@extend_schema_view(
    list=extend_schema(operation_id='topics_list'),
    retrieve=extend_schema(operation_id='topics_retrieve'),
    create=extend_schema(operation_id='topics_create'),
    update=extend_schema(operation_id='topics_update'),
    partial_update=extend_schema(operation_id='topics_partial_update'),
    destroy=extend_schema(operation_id='topics_destroy'),
)
class TopicViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        """
        Explicitly assign permissions based on the active ViewSet action lifecycle.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]
    
    queryset = Topic.objects.prefetch_related('subtopics').annotate(
        question_count=Count('subtopics__questions')
    )
    serializer_class = TopicSerializer

@extend_schema_view(
    list=extend_schema(operation_id='subtopics_list'),
    retrieve=extend_schema(operation_id='subtopics_retrieve'),
    create=extend_schema(operation_id='subtopics_create'),
    update=extend_schema(operation_id='subtopics_update'),
    partial_update=extend_schema(operation_id='subtopics_partial_update'),
    destroy=extend_schema(operation_id='subtopics_destroy'),
)
class SubtopicViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        """
        Explicitly assign permissions based on the active ViewSet action lifecycle.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]

    queryset = Subtopic.objects.select_related('topic').all()
    serializer_class = SubtopicSerializer

@extend_schema_view(
    list=extend_schema(operation_id='subtopic_mastery_list'),
    retrieve=extend_schema(operation_id='subtopic_mastery_retrieve'),
)
class SubtopicMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only. Mastery records are written exclusively by the FSRS engine
    via process_review() — never created or mutated directly through the API.
    Staff see all records; learners see only their own.
    """
    serializer_class = SubtopicMasterySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return SubtopicMastery.objects.none()
        if user.is_staff:
            return SubtopicMastery.objects.select_related('learner', 'subtopic__topic').all()
        return SubtopicMastery.objects.select_related('subtopic__topic').filter(learner=user)


@extend_schema_view(
    list=extend_schema(
        operation_id='enrollments_list',
        description="List the authenticated learner's subtopic enrollments (staff see all).",
    ),
    retrieve=extend_schema(operation_id='enrollments_retrieve'),
    create=extend_schema(
        operation_id='enrollments_create',
        request=EnrollmentCreateSerializer,
        responses={200: EnrollmentSerializer, 201: EnrollmentSerializer},
        description=(
            "Enroll the authenticated learner in a subtopic. Creates the "
            "SubtopicMastery row (state NEW) whose existence *is* the enrollment. "
            "Idempotent: re-posting an existing enrollment returns 200 (and leaves "
            "any accumulated FSRS state untouched); a brand new enrollment returns 201."
        ),
    ),
    destroy=extend_schema(
        operation_id='enrollments_destroy',
        description=(
            "Unenroll: delete the learner's SubtopicMastery for this subtopic. The "
            "subtopic stops surfacing questions and sessions immediately. Note this "
            "discards the FSRS history — re-enrolling starts fresh from NEW."
        ),
    ),
)
class EnrollmentViewSet(viewsets.ModelViewSet):
    """Student-facing enrollment flow, backed by SubtopicMastery.

    Enrollment is existence-based: a SubtopicMastery row for (learner, subtopic)
    *is* the enrollment. A learner enrolls (POST), lists their enrollments (GET),
    and unenrolls (DELETE). There is no status field and no separate table — the
    row's presence is the whole signal. PATCH/PUT are unsupported because there is
    nothing enrollment-specific to edit (FSRS fields are engine-only).
    """
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return SubtopicMastery.objects.none()
        qs = SubtopicMastery.objects.select_related('subtopic__topic')
        if user.is_staff:
            return qs.all()
        return qs.filter(learner=user)

    def create(self, request, *args, **kwargs):
        serializer = EnrollmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subtopic = serializer.validated_data['subtopic']

        # Existence of the mastery row is the enrollment. get_or_create makes the
        # write idempotent and never resets an existing card's FSRS state.
        mastery, created = SubtopicMastery.objects.get_or_create(
            learner=request.user, subtopic=subtopic,
        )

        out = EnrollmentSerializer(mastery, context=self.get_serializer_context())
        return Response(
            out.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


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



class ExtractQuestionsAPIView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    @extend_schema(
        operation_id='extract_questions_from_pdf',
        description='Upload a PDF textbook to automatically extract and categorize questions using Gemini AI. Restricted to staff users.',
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'pdf_file': {'type': 'string', 'format': 'binary'},
                    'num_questions': {'type': 'integer', 'description': 'Optional maximum number of questions to extract'}
                },
                'required': ['pdf_file']
            }
        },
        responses={
            202: {"type": "object", "properties": {"message": {"type": "string"}}},
            503: {"type": "object", "properties": {"error": {"type": "string"}, "hint": {"type": "string"}}},
        }
    )
    def post(self, request, *args, **kwargs):
        pdf_file = request.FILES.get('pdf_file')
        num_questions = request.data.get('num_questions')

        if not pdf_file:
            return Response({"error": "No pdf_file provided"}, status=400)

        if num_questions is not None:
            try:
                num_questions = int(num_questions)
            except ValueError:
                return Response({"error": "num_questions must be an integer"}, status=400)

        import os
        if not os.environ.get("GEMINI_API_KEY"):
            return Response(
                {"error": "GEMINI_API_KEY is not set", "hint": "Set GEMINI_API_KEY in backend/.env and restart the server."},
                status=503,
            )

        try:
            pdf_bytes = pdf_file.read()
            thread = threading.Thread(
                target=_background_extract,
                args=(pdf_bytes, num_questions)
            )
            thread.daemon = True
            thread.start()
            
            return Response({
                "message": "Extraction started in the background. Questions will appear shortly."
            }, status=202)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
