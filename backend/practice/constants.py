# XP-related constants
XP_PER_CORRECT_ANSWER = 10
XP_STREAK_BONUS_MULTIPLIER = 1.5

# Default FSRS initial baseline settings
DEFAULT_STABILITY = 1.0
DEFAULT_DIFFICULTY = 5.0
DEFAULT_RETRIEVABILITY = 1.0

# Memory State Scale Matches
STATE_CHOICES = [
    ('LEARNING', 'Learning'),
    ('REVIEW', 'Review'),
    ('RELEARNING', 'Relearning'),
]

# Question structure consants
TIER_CONCEPT = 1
TIER_APPLICATION = 2
TIER_SYNTHESIS = 3

TIER_CHOICES = [
    (TIER_CONCEPT, 'Concept'),
    (TIER_APPLICATION, 'Application'),
    (TIER_SYNTHESIS, 'Synthesis'),
]
MAX_CHOICES_PER_QUESTION = 4

# --- FSRS scheduling (v1) ---------------------------------------------------
# instead of jumping the full interval FSRS proposes after a good
# answer, we only advance a fraction of it as to adapt to a quant heavy field ->
# (cards come back sooner) instead of ballooning to months after a few correct
# answers like raw FSRS does.
#
#   1.0  -> trust FSRS fully            (2d, 12d, 52d, 177d ...)
#   0.5  -> balanced                    (4.5d, 12d, 32d, 76d ...)
#   0.25 -> conservative                (2d, 4d, 8d, 14d, 24d, 41d ...)
#   0.15 -> very gentle ramp (current)  (1.4d, 2.1d, 3.3d, 5.1d, 7.8d ...)
#
# This is the single knob to tune review aggressiveness. Lower = safer/shorter
# intervals, higher = longer intervals. See accuracy_to_speed() in fsrs_engine
# for the (not-yet-wired) per-learner version.
LEARNING_SPEED = 0.15

# Hard ceiling on how far out a review can be scheduled, in days. FSRS already
# floors review intervals at 1 day, so together these keep every interval in
# [1 day, MAX_INTERVAL_DAYS]. A low cap (30 = ~monthly) keeps even a fully
# mastered subtopic resurfacing so practice/testing stays observable; raise it
# for a real production rollout.
# NOTE: master previously set this to 365; lowered to 30 for the testing build.
MAX_INTERVAL_DAYS = 30

# --- Review forecast --------------------------------------------------------
# The "upcoming reviews" agenda groups a learner's scheduled reviews by day.
# DEFAULT_FORECAST_DAYS is the window used when the caller doesn't specify one;
# a caller may request a different window via ?days=, clamped to
# [1, MAX_FORECAST_DAYS]. Reviews are never scheduled past MAX_INTERVAL_DAYS, so
# a 30-day window already captures everything that's on the books.
DEFAULT_FORECAST_DAYS = 7
MAX_FORECAST_DAYS = 30
