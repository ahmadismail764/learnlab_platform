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
