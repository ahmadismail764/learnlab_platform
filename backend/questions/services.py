import math
from collections import deque
from datetime import datetime, timezone, timedelta
from fsrs import Card, Rating, Scheduler, State

from django.db import transaction

from .models import SingleQuestionInteraction, TopicMastery
from .fsrs_engine import process_topic_review, _RATING_MAP

def apply_fractional_update(mastery, rating_val: int, fraction: float):
    """
    Simulates a fractional FSRS review by computing the standard FSRS delta 
    and only applying a percentage (fraction) of that delta to the stability/difficulty.
    """
    if fraction >= 1.0:
        return process_topic_review(mastery, rating_val)
        
    fsrs_rating = _RATING_MAP.get(rating_val, Rating.Good)
    
    # 1. Reconstruct FSRS Card
    # FSRS expects None for uninitialized values; 0.0 causes ZeroDivisionError.
    card = Card(
        state=State(mastery.state),
        stability=mastery.stability or None,
        difficulty=mastery.difficulty or None,
        last_review=mastery.last_review_date,
    )
    
    # 2. Simulate Review
    scheduler = Scheduler()
    now = datetime.now(timezone.utc)
    new_card, _ = scheduler.review_card(card, fsrs_rating, review_datetime=now)
    
    # Initial fallbacks for new cards
    old_stab = mastery.stability or 0.0
    new_stab = new_card.stability or 0.0
    
    old_diff = mastery.difficulty or 0.0
    new_diff = new_card.difficulty or 0.0
    
    # 3. Apply fractional delta blending
    mastery.stability = old_stab + ((new_stab - old_stab) * fraction)
    mastery.difficulty = old_diff + ((new_diff - old_diff) * fraction)
    
    # Always update state and scheduling metadata for fractional reviews.
    # The fraction controls the *magnitude* of the stability/difficulty change,
    # but the card's state and review dates must stay consistent.
    mastery.state = new_card.state.value
    mastery.last_review_date = now

    # Scale the next review interval proportionally to the fraction.
    # A smaller fraction means a weaker implicit review, so the next review
    # should be scheduled further out (inverse relationship).
    if new_card.due:
        full_interval = (new_card.due - now).total_seconds()
        # Use inverse scaling: smaller fractions → longer intervals
        scaled_interval = full_interval / max(fraction, 0.1)
        mastery.next_review_date = now + timedelta(seconds=scaled_interval)
    else:
        mastery.next_review_date = new_card.due
            
    mastery.save()
    return mastery

@transaction.atomic
def process_interaction(learner, question, is_correct, session):
    """
    Core function for Fractional Implicit Repetition (FIRe).
    Logs the interaction, updates the primary topic, and walks the knowledge graph.
    
    Wrapped in transaction.atomic to ensure all DB mutations (interaction log,
    mastery updates across the graph, and gamification changes) are committed
    together or rolled back entirely.
    """
    # 1. Record the interaction
    SingleQuestionInteraction.objects.create(
        session=session,
        question=question,
        is_correct=is_correct,
        user_response="Correct" if is_correct else "Incorrect",
        confidence_rating=3 if is_correct else 1
    )
    
    topic = question.knowledge_point.topic
    
    # 2. Update Immediate TopicMastery
    mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=topic)
    base_rating = 3 if is_correct else 1
    
    # Explicit full update
    process_topic_review(mastery, base_rating)
    
    # 3. Graph Walk / FIRe Traversal
    visited = {topic.id}
    queue = deque([(topic, 1)]) # (topic_node, depth)
    
    # Exponential decay rate for fractional updates per edge distance
    DECAY_RATE = 0.5 
    MAX_DEPTH = 3
    
    while queue:
        curr_topic, depth = queue.popleft()
        
        if depth > MAX_DEPTH:
            continue
            
        fraction = DECAY_RATE ** depth
        
        if is_correct:
            # Trickle Down Credit: Traverse encompassings (simpler topics)
            # You proved mastery of a complex topic, so you implicitly practiced its dependencies.
            for enc_topic in curr_topic.encompassings.all():
                if enc_topic.id not in visited:
                    visited.add(enc_topic.id)
                    enc_mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=enc_topic)
                    
                    # Apply weak positive rating (2 = Hard, representing partial/implicit review)
                    apply_fractional_update(enc_mastery, rating_val=2, fraction=fraction)
                    queue.append((enc_topic, depth + 1))
        else:
            # Ripple Forward Penalty: Traverse advanced topics
            # You failed a foundational topic, so you are structurally weaker in advanced topics that rely on it.
            for adv_topic in curr_topic.prerequisite_for.all():
                if adv_topic.id not in visited:
                    visited.add(adv_topic.id)
                    adv_mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=adv_topic)
                    
                    # Apply fail rating (1 = Again)
                    apply_fractional_update(adv_mastery, rating_val=1, fraction=fraction)
                    queue.append((adv_topic, depth + 1))

    # 4. Gamification — delegate to Learner model methods for consistency
    if is_correct:
        base_xp = {1: 10, 2: 25, 3: 50}.get(question.tier, 10)
        multiplier = min(2.0, 1.0 + (learner.streak_count * 0.1))
        gained_xp = int(base_xp * multiplier)
        
        learner.add_xp(gained_xp)
        learner.update_streak()
        
        if session:
            session.total_xp_earned += gained_xp
            session.save()
    else:
        # On incorrect: just save learner (streak is not broken by wrong answers;
        # streaks are daily-level, meaning "did you practice today?")
        learner.save()
