import uuid
# Core django imports
from django.db import models
from django.conf import settings
# Our imports
from accounts.models import User
from topics.models import Subtopic
from practice.constants import TIER_CHOICES

class Question(models.Model):
    class QuestionType(models.TextChoices):
        MCQ = 'MCQ', 'Multiple choice'
        WRITTEN = 'WRITTEN', 'Written (free response)'

    class GradingMethod(models.TextChoices):
        EXACT_INDEX = 'EXACT_INDEX', 'Exact choice index (MCQ)'
        CAS = 'CAS', 'Symbolic equivalence (algebra)'
        # Reserved for a future LLM-graded path (proofs / open-ended answers).
        # Not yet implemented — see practice.grading for the active CAS grader.
        LLM = 'LLM', 'LLM rubric (planned)'

    # meta information about the question
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subtopic = models.ForeignKey(Subtopic, on_delete=models.SET_NULL, null=True, related_name='questions')
    tier = models.IntegerField(default=TIER_CHOICES[0][0], choices=TIER_CHOICES)

    # How the learner answers (question_type) is deliberately decoupled from how
    # the answer is graded (grading_method): a WRITTEN question is graded by CAS
    # today and could be graded by an LLM later without changing the answer UI.
    question_type = models.CharField(
        max_length=16, choices=QuestionType.choices, default=QuestionType.MCQ,
    )
    grading_method = models.CharField(
        max_length=16, choices=GradingMethod.choices, default=GradingMethod.EXACT_INDEX,
    )

    # the question itself
    text = models.TextField()

    # --- Multiple-choice fields (null/empty for written questions) ---
    choices = models.JSONField(default=list, blank=True)
    correct_answer_index = models.IntegerField(null=True, blank=True)

    # --- Written-answer field (empty for MCQ) ---
    # The canonical correct answer for a written question, stored as a plain
    # ASCII math expression (e.g. "2*x", "(x-1)*(x+1)", "x = 2"). Never exposed
    # to learners before they submit — grading is authoritative on the server.
    correct_answer = models.TextField(blank=True, default='')

    def __str__(self):
        subtopic_name = self.subtopic.name if self.subtopic else 'No subtopic'
        return f"[{subtopic_name}] T{self.tier}: {self.text[:60]}"


class PracticeSession(models.Model):
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='practice_sessions')

    # session data
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_xp_earned = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.learner} - {self.id}"


class QuestionResponse(models.Model):
    # keys
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(PracticeSession, on_delete=models.SET_NULL, null=True, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True)

    # server-side computed
    is_correct = models.BooleanField(default=False)
    # Set when a (parseable) answer is recorded. Type-agnostic "answered?" flag
    # so MCQ and written responses share one completion check. NULL = not yet
    # answered — an unparseable written attempt is handed back and also leaves
    # this NULL, so the learner can resubmit.
    answered_at = models.DateTimeField(null=True, blank=True)

    # data coming from the response
    selected_answer_index = models.IntegerField(null=True)        # MCQ answer
    written_answer = models.TextField(blank=True, default='')     # written answer (ASCII math)
    # Short post-submit note shown to the learner (e.g. the canonical answer, or
    # — later — LLM feedback). Populated by the grader.
    feedback = models.TextField(blank=True, default='')
    time_taken_seconds = models.IntegerField(default=0)
    confidence_rating = models.IntegerField(default=3) # e.g. 1 to 5 scale for FSRS conversion

    def __str__(self):
        return f"{self.session.learner}'s Response to Q:{self.question.id} in Session:{self.session.id}"
