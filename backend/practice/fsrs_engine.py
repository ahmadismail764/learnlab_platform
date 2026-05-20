# TODO(@nooruddina): This file is yours to edit! Implement the FSRS-5 algorithm and integrate it with the QuestionResponse model.
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from practice.models import QuestionResponse, Subtopic, SubtopicMastery


# the logic here is just arbitrary to avoid errors
# this is not for actual functionality of course
def get_rating(interaction: QuestionResponse) -> int:
    if not interaction.is_correct:
        return 1  # Again
    
    # Map confidence to FSRS rating scale if available (usually 1 to 5)
    confidence = getattr(interaction, 'confidence_rating', None)
    if confidence is not None and confidence > 0:
        return confidence
    
    return 3  # Good by default


# TODO: replace stub with full FSRS-5 implementation
def apply_fsrs(mastery: SubtopicMastery, rating: int) -> SubtopicMastery:
    """
    Apply FSRS scheduling to a SubtopicMastery record.

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
