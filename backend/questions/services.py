from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import QuestionResponse, Subtopic, SubtopicMastery


def get_rating(interaction: QuestionResponse) -> int:
    """Map a QuestionResponse to an FSRS rating (1-4).

    1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
    """
    if not interaction.is_correct:
        return 1

    if interaction.confidence_rating < 3:
        return 2
    if interaction.confidence_rating < 5:
        return 3
    return 4


# TODO: replace stub with full FSRS-5 implementation
def apply_fsrs(mastery: SubtopicMastery, rating: int) -> SubtopicMastery:
    """Apply FSRS scheduling to a SubtopicMastery record.

    Returns the mutated *mastery* instance **without** saving it —
    the caller is responsible for calling ``mastery.save()``.
    """
    now = timezone.now()

    if rating >= 3:
        mastery.stability = mastery.stability * 2
        mastery.reps += 1
        mastery.state = 'REVIEW'
    else:
        mastery.lapses += 1
        mastery.stability = max(1.0, mastery.stability * 0.5)
        mastery.state = 'RELEARNING'

    mastery.last_review = now
    mastery.next_review = now + timedelta(days=int(mastery.stability))

    return mastery


@transaction.atomic
def process_review(
    learner,
    subtopic: Subtopic,
    interaction: QuestionResponse,
) -> None:
    """Score a single review interaction and update the learner's mastery."""
    mastery, _created = SubtopicMastery.objects.get_or_create(
        learner=learner,
        subtopic=subtopic,
    )

    rating = get_rating(interaction)
    apply_fsrs(mastery, rating)
    mastery.save()


def get_due_topics(learner, limit: int = 5) -> list[Subtopic]:
    """Return up to *limit* subtopics that are due for review.

    Ordered by ``next_review`` ascending (most overdue first).
    """
    now = timezone.now()

    due_subtopic_ids = (
        SubtopicMastery.objects.filter(
            learner=learner,
            next_review__lte=now,
            state__in=['REVIEW', 'RELEARNING'],
        )
        .order_by('next_review')
        .values_list('subtopic_id', flat=True)[:limit]
    )

    # Preserve the ordering produced by the mastery query.
    subtopics_by_id = Subtopic.objects.in_bulk(list(due_subtopic_ids))
    return [subtopics_by_id[sid] for sid in due_subtopic_ids if sid in subtopics_by_id]
