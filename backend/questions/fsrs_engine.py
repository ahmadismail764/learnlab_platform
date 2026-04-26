"""
questions/fsrs_engine.py

Utility for running FSRS scheduling against a TopicMastery (Card) instance.
"""

from datetime import datetime, timezone

from fsrs import Card, Rating, Scheduler, State


# Map integer ratings (1-4) to FSRS Rating enum values.
_RATING_MAP: dict[int, Rating] = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
}


def process_topic_review(mastery, rating: int):
    """
    Run one FSRS review cycle against a TopicMastery instance.

    Args:
        mastery: A saved TopicMastery Django model instance.
        rating:  Integer in 1–4 (Again / Hard / Good / Easy).

    Returns:
        The updated and saved TopicMastery instance.

    Raises:
        ValueError: If rating is not in 1–4.
    """
    if rating not in _RATING_MAP:
        raise ValueError(f"Rating must be 1–4, got {rating!r}")

    fsrs_rating = _RATING_MAP[rating]

    # --- 1. Reconstruct the fsrs.Card from the stored Django fields ---
    # FSRS expects None for uninitialized values; 0.0 causes ZeroDivisionError.
    card = Card(
        state=State(mastery.state),                    # int → State enum
        stability=mastery.stability or None,           # 0.0 → None (new card)
        difficulty=mastery.difficulty or None,          # 0.0 → None (new card)
        last_review=mastery.last_review_date,          # already a UTC-aware datetime or None
    )

    # --- 2. Run the scheduler ---
    scheduler = Scheduler()
    now = datetime.now(timezone.utc)
    new_card, _review_log = scheduler.review_card(card, fsrs_rating, review_datetime=now)

    # --- 3. Map results back onto the Django instance ---
    mastery.state = new_card.state.value              # State enum → int
    mastery.stability = new_card.stability            # float
    mastery.difficulty = new_card.difficulty          # float
    mastery.last_review_date = new_card.last_review   # UTC datetime
    mastery.next_review_date = new_card.due           # UTC datetime (scheduled next review)

    # reps / lapses are not tracked by the fsrs library; manage them here.
    mastery.reps += 1
    if fsrs_rating == Rating.Again:
        mastery.lapses += 1

    # --- 4. Persist and return ---
    mastery.save()
    return mastery
