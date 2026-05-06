from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import SingleQuestionInteraction, Topic, TopicMastery


def get_rating(interaction: SingleQuestionInteraction) -> int:
    """Map a SingleQuestionInteraction to an FSRS rating (1-4).

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
def apply_fsrs(mastery: TopicMastery, rating: int) -> TopicMastery:
    """Apply FSRS scheduling to a TopicMastery record.

    Returns the mutated *mastery* instance **without** saving it —
    the caller is responsible for calling ``mastery.save()``.
    """
    now = timezone.now()

    if rating >= 3:
        mastery.stability = mastery.stability * 2
        mastery.reps += 1
        mastery.state = 'review'
    else:
        mastery.lapses += 1
        mastery.stability = max(1.0, mastery.stability * 0.5)
        mastery.state = 'relearning'

    mastery.last_review = now
    mastery.next_review = now + timedelta(days=int(mastery.stability))

    return mastery


@transaction.atomic
def process_review(
    learner,
    topic: Topic,
    interaction: SingleQuestionInteraction,
) -> None:
    """Score a single review interaction and update the learner's mastery."""
    mastery, _created = TopicMastery.objects.get_or_create(
        learner=learner,
        topic=topic,
    )

    rating = get_rating(interaction)
    apply_fsrs(mastery, rating)
    mastery.save()


def get_due_topics(learner, limit: int = 5) -> list[Topic]:
    """Return up to *limit* topics that are due for review.

    Ordered by ``next_review`` ascending (most overdue first).
    """
    now = timezone.now()

    due_topic_ids = (
        TopicMastery.objects.filter(
            learner=learner,
            next_review__lte=now,
            state__in=['review', 'relearning'],
        )
        .order_by('next_review')
        .values_list('topic_id', flat=True)[:limit]
    )

    # Preserve the ordering produced by the mastery query.
    topics_by_id = Topic.objects.in_bulk(list(due_topic_ids))
    return [topics_by_id[tid] for tid in due_topic_ids if tid in topics_by_id]
