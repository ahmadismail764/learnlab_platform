import math
from collections import deque
from datetime import datetime, timezone, timedelta

from django.db import transaction

from .models import SingleQuestionInteraction, TopicMastery

def apply_fractional_update(mastery, is_correct: bool, fraction: float):
    """
    Simulates a fractional review by adding or subtracting from mastery_level.
    """
    base_change = 10.0 if is_correct else -5.0
    change = base_change * fraction
    
    mastery.mastery_level += change
    
    if mastery.mastery_level > 100.0:
        mastery.mastery_level = 100.0
    elif mastery.mastery_level < 0.0:
        mastery.mastery_level = 0.0
        
    mastery.save()
    return mastery

@transaction.atomic
def process_interaction(learner, question, is_correct, session):
    """
    Core function for Fractional Implicit Repetition (FIRe) simplified.
    Logs the interaction, updates the primary topic, and walks the knowledge graph.
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
    
    # Explicit full update
    apply_fractional_update(mastery, is_correct, fraction=1.0)
    
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
                    
                    apply_fractional_update(enc_mastery, is_correct=True, fraction=fraction)
                    queue.append((enc_topic, depth + 1))
        else:
            # Ripple Forward Penalty: Traverse advanced topics
            # You failed a foundational topic, so you are structurally weaker in advanced topics that rely on it.
            for adv_topic in curr_topic.prerequisite_for.all():
                if adv_topic.id not in visited:
                    visited.add(adv_topic.id)
                    adv_mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=adv_topic)
                    
                    apply_fractional_update(adv_mastery, is_correct=False, fraction=fraction)
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
