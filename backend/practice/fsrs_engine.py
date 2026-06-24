"""FSRS-5 scheduling engine (v1).

This wires the `py-fsrs` library (the reference FSRS-5 implementation) into the
`SubtopicMastery` model, with one house refinement on top: a "Math Academy
fractional repetition" layer controlled by ``LEARNING_SPEED``.

Why the fractional layer?
    Raw FSRS is correct but aggressive for a fresh course: a learner who answers
    correctly a few times won't see a card again for months. The fractional
    layer only advances a *fraction* of the interval FSRS proposes, keeping
    reviews conservative and observable while we test. ``LEARNING_SPEED`` is the
    single knob (see practice/constants.py).

What this v1 deliberately does NOT do:
    - It does not seed new cards with a fake "Hard" first review. New cards start
      clean; the conservative interval growth comes from LEARNING_SPEED alone.

Quick start for teammates
--------------------------
    >>> from practice.fsrs_engine import preview_schedule
    >>> import fsrs
    >>> # "If this learner answers a fresh card correctly, when is it due?"
    >>> preview_schedule(mastery, fsrs.Rating.Good)
    {'interval_days': 1.0, 'stability': ..., 'difficulty': ..., 'state': 'LEARNING', ...}

Or from the command line:
    python manage.py simulate_fsrs --answers 1,1,1,0,1
"""
from collections import defaultdict
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from practice.models import QuestionResponse, Subtopic
from practice.constants import LEARNING_SPEED, MAX_INTERVAL_DAYS
from topics.models import SubtopicMastery
import fsrs
import math


# Sub-day "learning steps" are disabled on purpose. SubtopicMastery doesn't
# persist FSRS's internal learning ``step``, and we reconstruct the card from
# stored fields on every review — so Anki-style 1min/10min steps could never
# progress and cards would get stuck. Disabling them graduates a card straight
# to Review with a day-scale interval, which is what a cross-session subtopic
# tracker wants anyway.
scheduler = fsrs.Scheduler(learning_steps=(), relearning_steps=())

# Map between our SubtopicMastery.state strings and fsrs.State.
_STATE_TO_FSRS = {
    'NEW': fsrs.State.Learning,
    'LEARNING': fsrs.State.Learning,
    'REVIEW': fsrs.State.Review,
    'RELEARNING': fsrs.State.Relearning,
}
_FSRS_TO_STATE = {
    fsrs.State.Learning: 'LEARNING',
    fsrs.State.Review: 'REVIEW',
    fsrs.State.Relearning: 'RELEARNING',
}


# --- Ratings ---------------------------------------------------------------
def rating_from_outcome(is_correct: bool, confidence: int | None = None) -> fsrs.Rating:
    """Map a single answer's outcome to an FSRS rating.

    Wrong answer -> Again. Otherwise use the learner's confidence (1-5) if given,
    falling back to Good.
    """
    if not is_correct:
        return fsrs.Rating.Again

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


def get_rating(interaction: QuestionResponse) -> fsrs.Rating:
    """Back-compat: rating for a single QuestionResponse row."""
    return rating_from_outcome(
        interaction.is_correct, getattr(interaction, 'confidence_rating', None)
    )


def aggregate_session_to_fsrs_rating(results) -> fsrs.Rating:
    """Collapse a set of answers for one subtopic into a single rating.

    Accepts an iterable of QuestionResponse objects, bools, or ``(correct,)``
    tuples (as used in the original simulation script). Simple rule for v1:
    any wrong answer -> Again, all correct -> Good.
    """
    def _is_correct(item):
        if isinstance(item, QuestionResponse):
            return item.is_correct
        if isinstance(item, (tuple, list)):
            return bool(item[0])
        return bool(item)

    results = list(results)
    if not results:
        return fsrs.Rating.Good
    any_wrong = any(not _is_correct(r) for r in results)
    return fsrs.Rating.Again if any_wrong else fsrs.Rating.Good


def accuracy_to_speed(accuracy: float) -> float:
    """Map session accuracy to a LEARNING_SPEED value (0.2-0.4).

    Not wired into scheduling yet (v1 uses the static LEARNING_SPEED constant),
    but kept here so per-learner adaptive speed is a one-line change later.

        accuracy ~0.5 (struggling)  -> 0.2 (slower, shorter intervals)
        accuracy ~0.95 (nailing it) -> 0.4 (still conservative)
    """
    return max(0.2, min(0.4, 0.2 + (accuracy - 0.4) * 0.333))


# --- Core scheduling -------------------------------------------------------
def _schedule(
    *,
    state: str,
    stability,
    difficulty,
    last_review,
    next_review,
    rating: fsrs.Rating,
    now,
    speed: float,
    max_interval_days: float = MAX_INTERVAL_DAYS,
) -> dict:
    """Pure scheduling step. Returns the new card fields without touching the DB.

    Applies FSRS, then the Math Academy fractional dampening when FSRS proposes
    a *growing* interval longer than a day, then clamps the result to at most
    ``max_interval_days``. This is the shared core behind both ``apply_fsrs``
    (writes) and ``preview_schedule`` (read-only).
    """
    is_new = state == 'NEW'

    # Build the FSRS card. New cards start clean (no fake Hard seed).
    if is_new:
        card = fsrs.Card()
        old_interval = 0.0
        old_stability = 0.0
    else:
        card = fsrs.Card(
            state=_STATE_TO_FSRS.get(state, fsrs.State.Learning),
            stability=stability,
            difficulty=difficulty,
            due=next_review,
            last_review=last_review,
        )
        if last_review is not None and next_review is not None:
            old_interval = (next_review - last_review).total_seconds() / 86400.0
        else:
            old_interval = 0.0
        old_stability = stability or 0.0

    card, _log = scheduler.review_card(card, rating, now)

    new_interval_fsrs = (card.due - now).total_seconds() / 86400.0

    # Math Academy fractional repetition: only advance a fraction of FSRS's
    # proposed growth. Skip it for sub-day (learning-step) intervals and when
    # FSRS isn't actually growing the interval (e.g. a lapse).
    if speed < 1.0 and new_interval_fsrs > old_interval and card.due > now + timedelta(days=1):
        new_stability = card.stability if card.stability is not None else old_stability
        card.stability = old_stability + (new_stability - old_stability) * speed

        interval_growth = new_interval_fsrs - old_interval
        fractional_interval = max(1.0, old_interval + interval_growth * speed)
        card.due = now + timedelta(days=fractional_interval)

    # Hard ceiling: never schedule a review further out than max_interval_days,
    # so even a mastered subtopic keeps resurfacing.
    if max_interval_days is not None:
        capped_due = now + timedelta(days=max_interval_days)
        if card.due > capped_due:
            card.due = capped_due

    return {
        'state': _FSRS_TO_STATE.get(card.state, 'LEARNING'),
        'stability': card.stability,
        'difficulty': card.difficulty,
        'last_review': card.last_review,
        'due': card.due,
        'interval_days': (card.due - now).total_seconds() / 86400.0,
    }


def apply_fsrs(
    mastery: SubtopicMastery,
    rating: fsrs.Rating,
    *,
    speed: float = LEARNING_SPEED,
    now=None,
    max_interval_days: float = MAX_INTERVAL_DAYS,
) -> SubtopicMastery:
    """Apply FSRS scheduling to a SubtopicMastery record.

    Returns the mutated *mastery* instance **without** saving it — the caller is
    responsible for calling ``mastery.save()``.
    """
    now = now or timezone.now()

    result = _schedule(
        state=mastery.state,
        stability=mastery.stability,
        difficulty=mastery.difficulty,
        last_review=mastery.last_review,
        next_review=mastery.next_review,
        rating=rating,
        now=now,
        speed=speed,
        max_interval_days=max_interval_days,
    )

    mastery.state = result['state']
    if result['stability'] is not None:
        mastery.stability = result['stability']
    if result['difficulty'] is not None:
        mastery.difficulty = result['difficulty']
    mastery.last_review = result['last_review']
    mastery.next_review = result['due']

    if rating == fsrs.Rating.Again:
        mastery.lapses += 1
    else:
        mastery.reps += 1

    return mastery


def preview_schedule(
    mastery: SubtopicMastery,
    rating: fsrs.Rating,
    *,
    speed: float = LEARNING_SPEED,
    now=None,
    max_interval_days: float = MAX_INTERVAL_DAYS,
) -> dict:
    """Read-only "what would happen?" — returns the next interval & card fields.

    Lets teammates ask the engine for an interval without mutating or saving the
    mastery record. ``interval_days`` is the number of days until the card would
    next be due.
    """
    now = now or timezone.now()
    return _schedule(
        state=mastery.state,
        stability=mastery.stability,
        difficulty=mastery.difficulty,
        last_review=mastery.last_review,
        next_review=mastery.next_review,
        rating=rating,
        now=now,
        speed=speed,
        max_interval_days=max_interval_days,
    )


def _schedule_dict(mastery: SubtopicMastery) -> dict:
    """The schedule shape the contract functions return to callers."""
    if mastery.last_review and mastery.next_review:
        interval_days = (mastery.next_review - mastery.last_review).total_seconds() / 86400.0
    else:
        interval_days = 0.0
    return {
        'next_review': mastery.next_review,    # when it's due again (UTC)
        'interval_days': interval_days,         # days until next_review
        'stability': mastery.stability,
        'difficulty': mastery.difficulty,
        'state': mastery.state,                 # NEW|LEARNING|REVIEW|RELEARNING
        'reps': mastery.reps,
        'lapses': mastery.lapses,
        'last_review': mastery.last_review,
    }


@transaction.atomic
def process_review(
    learner,
    subtopic: Subtopic,
    *,
    is_correct: bool,
    confidence: int | None = None,
    now=None,
) -> dict:
    """CONTRACT: record one review of (learner, subtopic), advance & persist the
    FSRS state, and return the new schedule.

    Stateful — reads and writes the SubtopicMastery row for (learner, subtopic).

    Args:
        learner:    the User who answered.
        subtopic:   the Subtopic being reviewed.
        is_correct: did they get it right?
        confidence: optional 1-5 self-rating (maps to Hard/Good/Easy).
        now:        override the review time (defaults to now); handy for tests.

    Returns the schedule dict (see ``_schedule_dict``): next_review,
    interval_days, stability, difficulty, state, reps, lapses, last_review.
    """
    mastery, _created = SubtopicMastery.objects.get_or_create(
        learner=learner,
        subtopic=subtopic,
    )
    rating = rating_from_outcome(is_correct, confidence)
    apply_fsrs(mastery, rating, now=now)
    mastery.save()
    return _schedule_dict(mastery)


@transaction.atomic
def process_session(learner, session, *, now=None) -> dict:
    """CONTRACT: update FSRS once per subtopic for a whole finished session.

    Call this once, after a session is complete. Pass the PracticeSession; its
    responses are loaded and grouped by subtopic, and each subtopic gets a
    single aggregated review (any wrong answer in a subtopic -> Again, all
    correct -> Good).

    Why aggregate? A session can include several questions from the *same*
    subtopic, and FSRS expects one review of an item per sitting — reviewing a
    subtopic 5 times within seconds would inflate its stability as if it were
    studied on 5 separate days.

    Returns ``{subtopic_id: schedule_dict}`` for every subtopic touched.
    """
    responses = list(
        session.responses.select_related('question__subtopic').all()
    )

    by_subtopic = defaultdict(list)
    for response in responses:
        by_subtopic[response.question.subtopic].append(response)

    results = {}
    for subtopic, group in by_subtopic.items():
        rating = aggregate_session_to_fsrs_rating(group)
        mastery, _created = SubtopicMastery.objects.get_or_create(
            learner=learner,
            subtopic=subtopic,
        )
        apply_fsrs(mastery, rating, now=now)
        mastery.save()
        results[subtopic.id] = _schedule_dict(mastery)

    return results


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

def calculate_retention(stability: float, last_review, now=None) -> float:
    """Calculate estimated retention using the FSRS forgetting curve."""
    if not stability or stability <= 0 or last_review is None:
        return 0.0
    now = now or timezone.now()
    elapsed_days = (now - last_review).total_seconds() / 86400
    return round(math.exp(math.log(0.9) * elapsed_days / stability), 4)