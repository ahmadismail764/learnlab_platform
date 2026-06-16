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

# Standard maximum spacing boundary (e.g., maximum review gap in days)
MAX_INTERVAL_DAYS = 365

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