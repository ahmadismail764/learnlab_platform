# Framework imports
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer, OpenApiParameter, OpenApiTypes
from rest_framework import permissions, viewsets, generics, serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
# Our imports
from accounts.models import User
from practice.fsrs_engine import process_review
from practice.serializers import (
    QuestionResponseCreateSerializer,
    QuestionResponseSerializer, 
    PracticeSessionSerializer, 
    PracticeSessionCreateSerializer, 
    QuestionSerializer,
    LeaderboardSerializer
)
from practice.models import Question, PracticeSession, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('subtopic__topic')
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]

class PracticeSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return PracticeSession.objects.none()
        if user.is_staff:
            return PracticeSession.objects.all().order_by('-start_time')
        return PracticeSession.objects.filter(learner=user).order_by('-start_time')

    def get_serializer_class(self):
        if self.action == 'create':
            return PracticeSessionCreateSerializer
        return PracticeSessionSerializer

    def perform_create(self, serializer):
        serializer.save(learner=self.request.user)

    @extend_schema(
        request=QuestionResponseCreateSerializer,
        responses={201: QuestionResponseSerializer},
        description="Submit a single question response within an active practice session. Triggers FSRS review processing and updates session XP.",
    )
    @action(detail=True, methods=['post'])
    def responses(self, request, pk=None):
        session = self.get_object()
        if session.learner != request.user:
            raise PermissionDenied("Not your session.")

        serializer = QuestionResponseCreateSerializer(data=request.data)

        if serializer.is_valid():
            validated = serializer.validated_data
            question = validated['question']
            selected = validated['selected_answer_index']

            # compute correctness (server-side, of course)
            is_correct = (selected == question.correct_answer_index)

            response = QuestionResponse.objects.create(
                session=session,
                is_correct=is_correct,
                **validated
            )

            process_review(session.learner, response.question.subtopic, response)

            if response.is_correct:
                session.total_xp_earned += XP_PER_CORRECT_ANSWER
                session.save()

            return Response(QuestionResponseSerializer(response).data, status=201)
        return Response(serializer.errors, status=400)

class GenerateAdaptiveSessionView(generics.GenericAPIView):
    """
    GET /practice/sessions/generate-adaptive/

    Returns a list of questions for the learner's next practice session,
    prioritized by FSRS scheduling.

    Query params:
        ?topic=<uuid>   Optional. Restrict results to subtopics under
                         this topic.
        ?limit=<int>    Optional. Max number of questions to return.
                         Defaults to 10.

    The question list is built in three tiers, stopping as soon as
    `limit` questions have been collected:

        Tier 1 (due reviews)   — subtopics where FSRS says a review is
                                  due now (next_review <= now), ordered
                                  most overdue first.
        Tier 2 (unseen)        — subtopics the learner has no mastery
                                  record for at all (never practiced).
        Tier 3 (fallback)      — anything else, just to fill the quota.

    This guarantees the endpoint always returns up to `limit` questions
    as long as that many exist in the system (filtered by topic, if
    given), even for a brand-new learner with no mastery history.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuestionSerializer

    @extend_schema(
        description="Returns the next recommended set of questions for the learner. Due/overdue FSRS items appear first; falls back to unseen questions.",
        parameters=[
            OpenApiParameter(name='topic', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name='limit', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, required=False, default=10),
        ],
        responses={
            200: inline_serializer(
                name='GenerateAdaptiveSessionResponse',
                fields={
                    'questions': QuestionSerializer(many=True),
                    'message': serializers.CharField(),
                }
            )
        }
    )
    def get(self, request):
        from django.utils import timezone as django_timezone
        from topics.models import SubtopicMastery

        limit = int(request.query_params.get('limit', 10))
        topic_id = request.query_params.get('topic')
        learner = request.user
        now = django_timezone.now()

        # ------------------------------------------------------------
        # TIER 1 — Due reviews
        #
        # SubtopicMastery has no direct `topic` field — only a FK to
        # `subtopic`, and Subtopic has a FK to `topic`. So "mastery
        # records belonging to this topic" must be expressed via the
        # `subtopic__topic_id` join. This same join is reused in
        # Tiers 2 and 3 below for consistency.
        # ------------------------------------------------------------
        mastery_qs = SubtopicMastery.objects.filter(
            learner=learner,
            next_review__lte=now,
        )
        if topic_id:
            mastery_qs = mastery_qs.filter(subtopic__topic_id=topic_id)

        # Subtopic IDs ordered by how overdue they are — earliest
        # (most overdue) next_review comes first.
        due_subtopic_ids = list(
            mastery_qs.order_by('next_review').values_list('subtopic_id', flat=True)
        )

        # Pull every question belonging to a due subtopic...
        due_questions_qs = Question.objects.filter(subtopic_id__in=due_subtopic_ids)

        # ...then sort those questions so the most-overdue subtopic's
        # questions appear first. `subtopic_order_map` maps each
        # subtopic_id -> its position in due_subtopic_ids (0 = most
        # overdue). The sort key MUST be `q.subtopic_id` (the question's
        # foreign key to its subtopic) — NOT `q.id` (the question's own
        # primary key, which has no relationship to subtopic ordering).
        subtopic_order_map = {sid: idx for idx, sid in enumerate(due_subtopic_ids)}
        due_questions = sorted(
            due_questions_qs,
            key=lambda q: subtopic_order_map.get(q.subtopic_id, 9999)
        )[:limit]

        # ------------------------------------------------------------
        # TIER 2 — Unseen subtopics
        #
        # If Tier 1 didn't fill the quota, introduce new material:
        # subtopics this learner has never been assessed on (no
        # SubtopicMastery row exists yet, regardless of due date).
        # ------------------------------------------------------------
        if len(due_questions) < limit:
            seen_subtopic_ids = list(
                SubtopicMastery.objects.filter(learner=learner)
                .values_list('subtopic_id', flat=True)
            )
            unseen_qs = Question.objects.exclude(subtopic_id__in=seen_subtopic_ids)
            if topic_id:
                unseen_qs = unseen_qs.filter(subtopic__topic_id=topic_id)

            remaining = limit - len(due_questions)
            due_questions += list(unseen_qs[:remaining])

        # ------------------------------------------------------------
        # TIER 3 — Fallback
        #
        # Still short (e.g. a learner who has seen every subtopic and
        # has nothing due)? Grab any remaining questions not already
        # included, regardless of subtopic/mastery state, just to
        # reach `limit`.
        # ------------------------------------------------------------
        if len(due_questions) < limit:
            existing_ids = [q.id for q in due_questions]
            fallback_qs = Question.objects.exclude(id__in=existing_ids)
            if topic_id:
                fallback_qs = fallback_qs.filter(subtopic__topic_id=topic_id)

            remaining = limit - len(due_questions)
            due_questions += list(fallback_qs[:remaining])

        serializer = QuestionSerializer(due_questions, many=True)
        return Response({
            'questions': serializer.data,
            'message': f'Generated adaptive session with {len(due_questions)} question(s)',
        })


@extend_schema_view(
    list=extend_schema(
        description="Returns all learners ranked by XP descending. Staff accounts are excluded. Filter by ?topic=<uuid> to rank only learners with mastery records under that topic.",
        parameters=[
            OpenApiParameter(name='topic', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False, description='Filter leaderboard to learners active in this topic.'),
        ],
        responses={200: LeaderboardSerializer(many=True)},
    )
)
@method_decorator(cache_page(60 * 15), name='dispatch')
class LeaderboardView(generics.ListAPIView):
    """
    GET /practice/leaderboard/

    Returns all learners ranked by XP descending.
    Staff accounts are excluded — leaderboard is learners only.
    Optionally filter by topic: ?topic=<uuid> (returns learners
    who have at least one mastery record under that topic, still
    ranked by overall XP).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        topic_id = self.request.query_params.get('topic')

        # Base queryset — exclude staff, order by XP descending
        qs = User.objects.filter(is_staff=False).order_by('-current_xp')

        # Optional topic filter — only include learners who have
        # at least one SubtopicMastery record under this topic
        if topic_id:
            from topics.models import SubtopicMastery
            learner_ids = SubtopicMastery.objects.filter(
                subtopic__topic_id=topic_id
            ).values_list('learner_id', flat=True).distinct()
            qs = qs.filter(id__in=learner_ids)

        return qs