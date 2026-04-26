import math
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, F

from .models import SingleQuestionInteraction, TopicMastery, Topic

def calculate_net_work(session, topic):
    """
    Aggregates interactions in a session for a specific topic to yield +1.0, +0.5, or -1.0.
    For simplicity, if they got the last question correct, it's +1.0. If incorrect, -1.0.
    If multiple attempts or low confidence, we can yield +0.5.
    We will just look at the most recent interaction for the topic in the session.
    """
    latest_interaction = SingleQuestionInteraction.objects.filter(
        session=session,
        question__knowledge_point__topic=topic
    ).order_by('-id').first()

    if not latest_interaction:
        return 0.0

    if latest_interaction.is_correct:
        if latest_interaction.confidence_rating < 3:
            return 0.5  # Correct but guessed
        return 1.0
    else:
        return -1.0

def time_discount(mastery):
    """
    Returns a multiplier based on recency/due dates.
    0.3 if reviewed in last 7 days, 0.7 if due soon, 1.0 if due/overdue.
    """
    if not mastery.last_reviewed:
        return 1.0
    
    now = timezone.now()
    days_since_review = (now - mastery.last_reviewed).days

    if days_since_review <= 7:
        return 0.3
    
    if mastery.next_due:
        days_until_due = (mastery.next_due - now).days
        if days_until_due <= 3: # "Due soon"
            return 0.7

    return 1.0

@transaction.atomic
def process_review(learner, topic, net_work):
    """
    Updates the topic mastery and flows fractional credit down and penalties up.
    """
    mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=topic)
    
    discount = time_discount(mastery)
    discounted_work = net_work * discount

    # Update immediate topic
    mastery.update_after_review(discounted_work)

    if net_work > 0:
        # Flow fractional credit DOWN
        for encompassing in topic.encompasses.all():
            fractional_work = discounted_work * encompassing.weight
            simple_topic = encompassing.simple_topic
            simple_mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=simple_topic)
            simple_mastery.update_after_review(fractional_work)
            # Math Academy doesn't recursively trickle down infinitely, but we could.
            # To prevent infinite loops or over-engineering, we'll do just 1 level deep for now.
    
    elif net_work < 0:
        # Flow penalties UP
        # We flow up to topics that encompass this failed topic.
        for encompassing in topic.encompassed_by.all():
            fractional_work = net_work * encompassing.weight
            advanced_topic = encompassing.advanced_topic
            adv_mastery, _ = TopicMastery.objects.get_or_create(learner=learner, topic=advanced_topic)
            adv_mastery.update_after_review(fractional_work)

def get_due_topics(learner, limit=5):
    """
    Find learned topics where next_due <= now, sort by "knockout power".
    Knockout power = how many other due topics each encompasses.
    """
    now = timezone.now()
    due_masteries = TopicMastery.objects.filter(
        learner=learner,
        status='learned',
        next_due__lte=now
    ).select_related('topic')

    due_topic_ids = [m.topic_id for m in due_masteries]
    
    if not due_topic_ids:
        return []

    # Calculate knockout power
    topics_with_power = []
    for mastery in due_masteries:
        topic = mastery.topic
        knockout_power = topic.encompasses.filter(simple_topic_id__in=due_topic_ids).count()
        topics_with_power.append((knockout_power, topic))

    # Sort descending by knockout power
    topics_with_power.sort(key=lambda x: x[0], reverse=True)

    return [t[1] for t in topics_with_power[:limit]]
