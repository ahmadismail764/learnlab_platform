# Code Diff: [fsrs_engine.py](file:///g:/Uni/GradProj/learnlab_platform/backend/questions/fsrs_engine.py) — Full Rewrite

```diff:fsrs_engine.py
import math
from datetime import datetime, timedelta, timezone
from fsrs import Scheduler, Card, Rating, State

def calculate_retrievability(stability: float, elapsed_days: float) -> float:
    """Calculate probability of recall using FSRS formula."""
    if stability <= 0:
        return 0.0
    return math.exp(elapsed_days / stability * math.log(0.9))

def select_question_tier(stability: float) -> int:
    """Select appropriate question tier based on stability."""
    if stability < 5:
        return 1  # Conceptual
    elif stability < 20:
        return 2  # Application
    else:
        return 3  # Synthesis

def update_stability(current_stability: float, current_difficulty: float, last_review: datetime, rating_val: int):
    """
    Update stability and difficulty using FSRS.
    rating_val: 1=Again (Wrong), 2=Hard, 3=Good (Correct), 4=Easy (Correct + High Confidence)
    Returns: (new_stability, new_difficulty)
    """
    scheduler = Scheduler()

    # Map integer rating to FSRS Rating enum
    rating_map = {
        1: Rating.Again,
        2: Rating.Hard,
        3: Rating.Good,
        4: Rating.Easy
    }
    rating = rating_map.get(rating_val, Rating.Good)

    now = datetime.now(timezone.utc)

    # Create a Card object from current state
    if current_stability <= 0:
        # New card
        card = Card()
    else:
        card = Card()
        card.stability = current_stability
        card.difficulty = current_difficulty
        card.last_review = last_review
        card.state = State.Review
        # We assume due is now for calculation purposes if not stored
        card.due = now

    # Review the card
    new_card, review_log = scheduler.review_card(card, rating, review_datetime=now)

    return new_card.stability, new_card.difficulty

def calculate_next_review(stability: float, desired_retention: float = 0.9) -> timedelta:
    """Calculate optimal interval for next review."""
    if stability <= 0:
        return timedelta(minutes=10)

    # FSRS formula approximation as per prompt
    interval_days = stability * math.log(desired_retention) / math.log(0.9)
    return timedelta(days=max(1, round(interval_days)))
===
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
    card = Card(
        state=State(mastery.state),                    # int → State enum
        stability=mastery.stability or None,           # 0.0 stored as None for new cards
        difficulty=mastery.difficulty or None,         # same treatment
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

```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `State(mastery.state)` | [Card](file:///C:/Users/WELCOME/AppData/Roaming/Python/Python313/site-packages/fsrs/card.py#36-165) requires a `State` enum, not a raw int. The stored int is converted on construction and written back via `.value`. |
| `stability or None` | The library expects `None` for a brand-new card (no stability yet), not `0.0`. Using `or None` handles the zero-default from the model. |
| `reps` / `lapses` managed here | The `fsrs` library does not track these fields — they exist only in our model. `reps` is always incremented; `lapses` only on `Rating.Again`. |
| `new_card.due` → `next_review_date` | `Scheduler.review_card()` sets `card.due` to the next scheduled datetime. This is the canonical source for `next_review_date`. |

> [!IMPORTANT]
> Ensure `last_review_date` stored in the DB is **timezone-aware (UTC)**. The `fsrs` scheduler rejects naive datetimes.
