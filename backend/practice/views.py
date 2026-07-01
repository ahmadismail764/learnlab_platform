# Core django imports
import random
from django.utils import timezone as django_timezone
from django.db import transaction
# DRF imports
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer, OpenApiParameter, OpenApiTypes
from rest_framework import viewsets, serializers, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
# Our imports
from practice.fsrs_engine import get_review_forecast
from practice.serializers import (
    QuestionAdminSerializer,
    QuestionCreateAndUpdateSerializer,
    QuestionSerializer,
    QuestionResponseFeedbackSerializer,
    AnswerSubmitSerializer,
    PracticeSessionSerializer,
    PracticeSessionCompletionSerializer,
    ReviewForecastSerializer,
)
from django.shortcuts import get_object_or_404
from practice.models import Question, PracticeSession, QuestionResponse
from practice.constants import XP_PER_CORRECT_ANSWER, DEFAULT_FORECAST_DAYS, MAX_FORECAST_DAYS
from practice.grading import grade_written_answer
from topics.models import SubtopicMastery


def questions_for_learner(user):
    """Questions the learner is allowed to see — the single isolation gate.

    Enrollment is existence-based: a learner is enrolled in a subtopic iff they
    have a SubtopicMastery row for it. This filter is the one place that rule is
    encoded, so every call site (question list/retrieve and both session-sourcing
    passes) inherits the same WHERE clause and no code path can leak a question
    from a subtopic the learner isn't studying. Staff bypass isolation.
    """
    qs = Question.objects.select_related('subtopic__topic')
    if getattr(user, 'is_staff', False):
        return qs
    if user is None or not getattr(user, 'is_authenticated', False):
        return qs.none()
    return qs.filter(subtopic__masteries__learner=user)


class QuestionViewSet(viewsets.ModelViewSet):
    # Optimized Join handling syntax
    queryset = Question.objects.select_related('subtopic__topic').all()

    def get_queryset(self):
        """Structurally isolate learner reads to their enrolled subtopics.

        list/retrieve run through ``questions_for_learner`` so a learner can
        never fetch — or even 404-probe — a question from a subtopic they aren't
        studying. Admin write actions keep the unfiltered queryset so staff can
        author across all subtopics.
        """
        if self.action in ['list', 'retrieve']:
            return questions_for_learner(self.request.user)
        return Question.objects.select_related('subtopic__topic').all()

    def get_permissions(self):
        """
        Explicitly assign permissions based on the active ViewSet action lifecycle.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Dynamically route serializers to isolate sensitive data fields.
        Staff reads get correct_answer_index; learner reads never do.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateAndUpdateSerializer
        if self.request and self.request.user and self.request.user.is_staff:
            return QuestionAdminSerializer
        return QuestionSerializer


@extend_schema_view(
    list=extend_schema(operation_id='practice_sessions_list'),
    retrieve=extend_schema(
        operation_id='practice_sessions_retrieve',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
    ),
    create=extend_schema(
        operation_id='practice_sessions_create',
        parameters=[
            OpenApiParameter('topic', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False,
                             description='Filter questions by parent topic UUID.'),
            OpenApiParameter('subtopic', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False,
                             description='Filter questions by subtopic UUID (takes precedence over topic when both are provided).'),
            OpenApiParameter('limit', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, required=False,
                             description='Maximum number of questions to include (default 10).'),
        ],
    ),
    update=extend_schema(
        operation_id='practice_sessions_update',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
        responses={200: PracticeSessionCompletionSerializer},
        description=(
            "Update a practice session. Setting end_time marks the session complete: "
            "this triggers FSRS scheduling and the response includes a next_review "
            "headline (soonest upcoming review + per-day forecast)."
        ),
    ),
    partial_update=extend_schema(
        operation_id='practice_sessions_partial_update',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
        responses={200: PracticeSessionCompletionSerializer},
        description=(
            "Partially update a practice session. Setting end_time marks the session "
            "complete: this triggers FSRS scheduling and the response includes a "
            "next_review headline (soonest upcoming review + per-day forecast)."
        ),
    ),
    destroy=extend_schema(
        operation_id='practice_sessions_destroy',
        parameters=[OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)],
    ),
)
class PracticeSessionViewSet(viewsets.ModelViewSet):
    #######################################
    # Management 
    #######################################
    serializer_class = PracticeSessionSerializer

    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PracticeSession.objects.all().order_by('-start_time')
        return PracticeSession.objects.filter(learner=user).order_by('-start_time')

    def update(self, request, *args, **kwargs):
        """Update a session; when it becomes complete, append the next-review headline.

        FSRS scheduling runs in PracticeSessionSerializer.update() the moment a
        session's end_time is set. Once it's complete we re-serialize with
        PracticeSessionCompletionSerializer so the learner immediately sees when
        their next reviews are due (the "come back on X" headline). Covers PATCH
        too — DRF routes partial_update through update().
        """
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            instance = self.get_object()
            if instance.end_time is not None:
                response.data = PracticeSessionCompletionSerializer(
                    instance, context=self.get_serializer_context()
                ).data
        return response

    ##################################################################
    
    # This is for the POST method.
    # This is where we need to creaate  a bit of custom logic
    def create(self, request, *args, **kwargs):
        """
        Create a session and immediately seed it with empty response placeholders.

        Question sourcing is localized to the learner's enrolled subtopics: both
        the due-first pass and the fallback draw from ``questions_for_learner``
        so an un-enrolled subtopic can never leak into a session (Strict
        Isolation). A ``subtopic`` filter the learner isn't enrolled in is
        rejected with 403 rather than silently returning an empty session.
        """
        limit = int(request.query_params.get('limit', 10))
        topic_id = request.query_params.get('topic')
        subtopic_id = request.query_params.get('subtopic')
        learner = request.user
        now = django_timezone.now()

        # Base pool: only questions from subtopics this learner is enrolled in
        # (i.e. has a SubtopicMastery row for).
        enrolled_questions = questions_for_learner(learner)

        if subtopic_id:
            is_enrolled = SubtopicMastery.objects.filter(
                learner=learner,
                subtopic_id=subtopic_id,
            ).exists()
            if not is_enrolled:
                return Response(
                    {"detail": "You are not enrolled in this subtopic."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            enrolled_questions = enrolled_questions.filter(subtopic_id=subtopic_id)
        elif topic_id:
            enrolled_questions = enrolled_questions.filter(subtopic__topic_id=topic_id)

        # Due-first: subtopics whose FSRS review is already due, shuffled.
        due_shuffled_qs = enrolled_questions.filter(
            subtopic__masteries__learner=learner,
            subtopic__masteries__next_review__lte=now,
        ).order_by('?')
        session_questions = list(due_shuffled_qs[:limit])

        # Fallback stays inside the enrolled pool — never the global bank.
        if not session_questions:
            # enrolled_questions already carries any subtopic/topic filter applied
            # above, so we never reach an un-enrolled subtopic here. Random offset
            # instead of ORDER BY RANDOM() — avoids a full-table sort that would
            # scan every row before picking `limit` results.
            count = enrolled_questions.count()
            if count:
                offset = random.randint(0, max(0, count - limit))
                session_questions = list(enrolled_questions[offset:offset + limit])

        with transaction.atomic():
            session = PracticeSession.objects.create(learner=learner)
            placeholders = [
                QuestionResponse(
                    session=session,
                    question=question,
                    selected_answer_index=None,
                    is_correct=False
                )
                for question in session_questions
            ]
            QuestionResponse.objects.bulk_create(placeholders)

        session_serializer = PracticeSessionSerializer(session, context={'request': request})
        response_data = session_serializer.data
        response_data['message'] = f'Generated adaptive session with {len(session_questions)} placeholders.'

        return Response(response_data, status=status.HTTP_201_CREATED)

    @extend_schema(
        operation_id='practice_sessions_patch_response',
        request=AnswerSubmitSerializer,
        responses={
            200: QuestionResponseFeedbackSerializer,
            400: inline_serializer('AnswerSubmitError', fields={'detail': serializers.CharField()}),
            422: inline_serializer('UnparseableAnswer', fields={
                'detail': serializers.CharField(),
                'status': serializers.CharField(),
                'written_answer': serializers.CharField(),
            }),
        },
        parameters=[
            OpenApiParameter('id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, description='Practice session UUID'),
            OpenApiParameter('question_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH, description='Question UUID to answer'),
        ],
        description=(
            "Submit an answer for one question in an active practice session. "
            "The session must have been created via POST /sessions/ which seeds placeholder responses. "
            "MCQ questions take selected_answer_index; written questions take written_answer "
            "(plain ASCII math). Returns the full feedback including the answer key for post-submit "
            "reveal. A written answer that can't be parsed/graded returns 422 and is NOT recorded — "
            "the learner should review and resubmit. Re-submitting an already-answered question returns 400."
        ),
    )
    @action(detail=True, methods=['patch'], url_path=r'responses/(?P<question_id>[^/.]+)')
    def submit_response(self, request, pk=None, question_id=None):
        session = self.get_object()
        if session.learner != request.user:
            raise PermissionDenied("You do not have permission to modify this session.")

        response = get_object_or_404(QuestionResponse, session=session, question_id=question_id)

        # answered_at is the type-agnostic "already answered?" check (MCQ and
        # written share it). An unparseable written attempt leaves it NULL, so a
        # learner can resubmit after a 422.
        if response.answered_at is not None:
            return Response({"detail": "This question has already been answered."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        question = response.question
        if question is None:
            return Response({"detail": "Question no longer exists."}, status=status.HTTP_410_GONE)

        if question.question_type == Question.QuestionType.WRITTEN:
            written = (data.get('written_answer') or '').strip()
            if not written:
                return Response(
                    {"detail": "written_answer is required for this question."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = grade_written_answer(question.correct_answer, written)
            if result.is_invalid:
                # Couldn't grade — hand the question back to the learner. Nothing
                # is finalized: no answered_at, no XP, no FSRS impact. They can
                # fix their input and resubmit.
                return Response(
                    {"detail": result.feedback, "status": "invalid", "written_answer": written},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            is_correct = result.is_correct
            response.written_answer = written
            response.feedback = result.feedback or (
                "Correct!" if is_correct else f"Not quite. Expected: {question.correct_answer}"
            )
        else:
            selected = data.get('selected_answer_index')
            if selected is None:
                return Response(
                    {"detail": "selected_answer_index is required for this question."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            is_correct = (selected == question.correct_answer_index)
            response.selected_answer_index = selected

        response.is_correct = is_correct
        response.answered_at = django_timezone.now()
        if 'confidence_rating' in data:
            response.confidence_rating = data['confidence_rating']
        response.save()

        if is_correct:
            session.total_xp_earned += XP_PER_CORRECT_ANSWER
            session.save()

        return Response(QuestionResponseFeedbackSerializer(response).data, status=status.HTTP_200_OK)

# class QuestionResponseViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     Read-only viewset for question responses.
#     Staff see all; learners see only their own session responses.
#     """
#     permission_classes = [IsAuthenticated]
#     serializer_class = QuestionResponseFeedbackSerializer

#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff:
#             return QuestionResponse.objects.select_related('question').all()
#         return QuestionResponse.objects.select_related('question').filter(session__learner=user)


class ReviewForecastView(APIView):
    """GET /api/v1/practice/review-forecast/ — the learner's upcoming reviews.

    Returns the learner's scheduled FSRS reviews grouped by day (an agenda),
    each day listing the subtopics due, plus the soonest upcoming date and how
    many subtopics are due right now. The window is selectable via ?days=.
    Powers the post-session "come back on X" headline and a dashboard review
    agenda. Reads only the requesting learner's own scheduling data.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id='practice_review_forecast',
        parameters=[
            OpenApiParameter(
                'days',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=False,
                description=(
                    f"Forecast window in days (default {DEFAULT_FORECAST_DAYS}, "
                    f"clamped to [1, {MAX_FORECAST_DAYS}]). E.g. days=30 for a month."
                ),
            ),
        ],
        responses={200: ReviewForecastSerializer},
        description=(
            "Return the authenticated learner's upcoming FSRS reviews grouped by "
            "calendar day (UTC) for the next `days` days: each day lists the "
            "subtopics due (with their topic), plus the soonest upcoming review "
            "date and how many subtopics are already due now. Only the learner's "
            "own reviews are included."
        ),
    )
    def get(self, request):
        raw_days = request.query_params.get('days', DEFAULT_FORECAST_DAYS)
        try:
            days = int(raw_days)
        except (TypeError, ValueError):
            days = DEFAULT_FORECAST_DAYS
        forecast = get_review_forecast(request.user, days=days)
        return Response(ReviewForecastSerializer(forecast).data)
