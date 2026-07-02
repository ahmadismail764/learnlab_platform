"""Build the review-reminder digest for a learner.

This is the read/query side of the review notification: given a learner, work out
what they have *due right now* and package it for an email (or, later, any other
channel). It is channel-agnostic on purpose — the email module and the management
command both consume the plain dict this returns.

"Due" here means the same thing it does everywhere else in the app: a
``SubtopicMastery`` whose ``next_review`` has arrived (``next_review <= now``).
That matches ``practice.fsrs_engine.get_review_forecast``'s ``due_now`` semantics,
so the email and the in-app forecast never disagree about what's due.
"""
from django.utils import timezone
# Our imports
from topics.models import SubtopicMastery


def build_review_reminder(learner, *, now=None):
    """Return the review-reminder payload for ``learner``, or ``None`` if nothing is due.

    Returning ``None`` (rather than an empty digest) lets callers simply skip a
    learner — we never send a "you have 0 reviews" email.

    The payload dict:
        due_now_count:   number of subtopics due right now.
        due_subtopics:   ``[{'name', 'topic_name'}, ...]`` ordered most-overdue first.
        next_review_at:  ``date`` of the soonest FUTURE review (a gentle "next up"
                         line), or ``None`` if nothing is scheduled after now.
    """
    now = now or timezone.now()

    due = (
        SubtopicMastery.objects
        .filter(learner=learner, next_review__isnull=False, next_review__lte=now)
        .select_related('subtopic__topic')
        .order_by('next_review')
    )
    due_subtopics = [
        {
            'name': m.subtopic.name,
            'topic_name': m.subtopic.topic.name if m.subtopic.topic else None,
        }
        for m in due
    ]
    if not due_subtopics:
        return None

    # Soonest review still in the future — mirrors get_review_forecast's headline.
    soonest = (
        SubtopicMastery.objects
        .filter(learner=learner, next_review__gt=now)
        .order_by('next_review')
        .values_list('next_review', flat=True)
        .first()
    )
    next_review_at = timezone.localtime(soonest).date() if soonest else None

    return {
        'due_now_count': len(due_subtopics),
        'due_subtopics': due_subtopics,
        'next_review_at': next_review_at,
    }
