# TODO(@nooruddina): This file is yours to edit! Implement the FSRS-5 algorithm and integrate it with the QuestionResponse model.
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from practice.models import QuestionResponse, Subtopic
from topics.models import SubtopicMastery
import fsrs


def get_rating(interaction: QuestionResponse) -> fsrs.Rating:
    if not interaction.is_correct:
        return fsrs.Rating.Again
    
    # Map confidence to FSRS rating scale if available (usually 1 to 5)
    confidence = getattr(interaction, 'confidence_rating', None)
    if confidence is not None:
        # FSRS Rating scale: 1=Again, 2=Hard, 3=Good, 4=Easy
        if confidence <= 1:
            return fsrs.Rating.Again
        elif confidence == 2:
            return fsrs.Rating.Hard
        elif confidence == 3:
            return fsrs.Rating.Good
        else:
            return fsrs.Rating.Easy
    
    return fsrs.Rating.Good


scheduler = fsrs.Scheduler()


def apply_fsrs(mastery: SubtopicMastery, rating: fsrs.Rating) -> SubtopicMastery:
    """
    Apply FSRS scheduling to a SubtopicMastery record.

    Returns the mutated *mastery* instance **without** saving it —
    the caller is responsible for calling ``mastery.save()``.
    """
    now = timezone.now()

    # Map SubtopicMastery state to fsrs.State
    state_mapping = {
        'NEW': fsrs.State.Learning,
        'LEARNING': fsrs.State.Learning,
        'REVIEW': fsrs.State.Review,
        'RELEARNING': fsrs.State.Relearning
    }
    fsrs_state = state_mapping.get(mastery.state, fsrs.State.Learning)

    # Initialize FSRS Card
    card = fsrs.Card(
        state=fsrs_state,
        stability=mastery.stability if mastery.state != 'NEW' else None,
        difficulty=mastery.difficulty if mastery.state != 'NEW' else None,
        due=mastery.next_review,
        last_review=mastery.last_review,
    )

    # Run scheduler
    card, log = scheduler.review_card(card, rating, now)

    # Map updated Card back to SubtopicMastery
    state_reverse_mapping = {
        fsrs.State.Learning: 'LEARNING',
        fsrs.State.Review: 'REVIEW',
        fsrs.State.Relearning: 'RELEARNING'
    }
    mastery.state = state_reverse_mapping.get(card.state, 'LEARNING')

    if card.stability is not None:
        mastery.stability = card.stability
    if card.difficulty is not None:
        mastery.difficulty = card.difficulty

    mastery.last_review = card.last_review
    mastery.next_review = card.due

    if rating == fsrs.Rating.Again:
        mastery.lapses += 1
    else:
        mastery.reps += 1

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
