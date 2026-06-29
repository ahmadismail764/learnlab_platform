"""Symbolic grading for written (free-response) algebra answers — Approach A.

The learner's on-screen math keyboard (MathLive) produces LaTeX; the frontend
converts it to plain ASCII math via ``convertLatexToAsciiMath()`` and sends that
string here. Grading runs on the server with SymPy, so the correct answer never
leaves the backend (authoritative grading).

Public entry point::

    grade_written_answer(correct, submitted) -> GradeResult

with one of three outcomes:

    CORRECT   - ``submitted`` is mathematically equivalent to ``correct``
    INCORRECT - parsed fine, but not equivalent
    INVALID   - couldn't be parsed/compared (or grading timed out); the caller
                hands the question back to the learner to review. An INVALID
                answer is **never** counted as wrong, so a correct-but-unparseable
                answer can't corrupt the learner's FSRS schedule.

Equivalence policy (v1): flexible — any mathematically equal form is accepted
(``x+x`` == ``2*x``, ``(x-1)(x+1)`` == ``x^2-1``, ``0.5`` == ``1/2``,
``sqrt(x)`` == ``x^(1/2)``), via SymPy's ``.equals()`` (symbolic + numeric).

Scope (v1): algebra — expressions and simple equations. Sets, logic, and proofs
are out of scope and are expected to use a different ``grading_method`` (e.g. an
LLM) later; this module only handles ``GradingMethod.CAS``.
"""
from __future__ import annotations

from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

import sympy
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)

from practice.constants import WRITTEN_ANSWER_MAX_LENGTH, GRADING_TIMEOUT_SECONDS

# --- Outcomes ---------------------------------------------------------------
CORRECT = 'correct'
INCORRECT = 'incorrect'
INVALID = 'invalid'

# Learner-facing copy for the non-graded paths. Kept terse and non-accusatory:
# an INVALID result is "we couldn't read it", not "you're wrong".
_MSG_UNREADABLE = "We couldn't read that answer. Please review your input and try again."
_MSG_UNGRADEABLE = "We couldn't grade that answer automatically. Please review it and try a simpler form."
_MSG_TIMEOUT = "That answer took too long to grade. Please review it and try a simpler form."
_MSG_BAD_KEY = "This question's answer key could not be parsed. Please report this question."

# ``^`` means power (not XOR) and ``2x`` means ``2*x`` — i.e. what a student means.
_TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)


@dataclass
class GradeResult:
    """The outcome of grading one written answer."""
    outcome: str          # CORRECT / INCORRECT / INVALID
    feedback: str = ''    # short learner-facing note

    @property
    def is_correct(self) -> bool:
        return self.outcome == CORRECT

    @property
    def is_invalid(self) -> bool:
        return self.outcome == INVALID


def _parse(text: str):
    """Parse one ASCII math string into a tagged SymPy form.

    Returns ``('expression', expr, None)`` or ``('equation', lhs, rhs)``.
    Raises on anything unparseable so the caller can route it to INVALID.

    Uses ``parse_expr`` with a restricted transformation set rather than
    ``sympify`` — it does not ``eval`` arbitrary Python, which keeps untrusted
    learner input from being a code-execution vector. The length cap and the
    wall-clock timeout in :func:`grade_written_answer` bound the work further.
    """
    text = (text or '').strip()
    if not text:
        raise ValueError('empty answer')
    if len(text) > WRITTEN_ANSWER_MAX_LENGTH:
        raise ValueError('answer too long')

    if '=' in text:
        left, _, right = text.partition('=')
        if not left.strip() or not right.strip():
            raise ValueError('malformed equation')
        return (
            'equation',
            parse_expr(left, transformations=_TRANSFORMATIONS),
            parse_expr(right, transformations=_TRANSFORMATIONS),
        )

    return ('expression', parse_expr(text, transformations=_TRANSFORMATIONS), None)


def _equations_equivalent(a_lhs, a_rhs, b_lhs, b_rhs) -> bool:
    """True iff two equations have the same solution set.

    ``A = B`` is equivalent to ``C = D`` iff ``(A - B)`` is a nonzero constant
    multiple of ``(C - D)``. Handles ``x = 2`` vs ``2 = x`` (ratio -1) and
    ``2x = 4`` vs ``x = 2`` (ratio 2).
    """
    d1 = sympy.simplify(a_lhs - a_rhs)
    d2 = sympy.simplify(b_lhs - b_rhs)
    z1 = (d1 == 0)
    z2 = (d2 == 0)
    if z1 or z2:
        return bool(z1 and z2)
    ratio = sympy.simplify(d1 / d2)
    return bool(ratio.is_number) and ratio != 0


def _grade(correct: str, submitted: str) -> GradeResult:
    """Core grading (no timeout wrapper)."""
    # The learner's answer is the common failure point — parse it first.
    try:
        sub = _parse(submitted)
    except Exception:
        return GradeResult(INVALID, feedback=_MSG_UNREADABLE)

    # A failure parsing the stored answer is an authoring bug, not a learner
    # error — surface it as INVALID so it's noticed, never silently "wrong".
    try:
        cor = _parse(correct)
    except Exception:
        return GradeResult(INVALID, feedback=_MSG_BAD_KEY)

    # An expression can't be equivalent to an equation.
    if cor[0] != sub[0]:
        return GradeResult(INCORRECT)

    try:
        if cor[0] == 'equation':
            equal = _equations_equivalent(cor[1], cor[2], sub[1], sub[2])
            return GradeResult(CORRECT if equal else INCORRECT)

        # Expression: .equals() does symbolic simplification + numeric probing.
        verdict = cor[1].equals(sub[1])
        if verdict is True:
            return GradeResult(CORRECT)
        if verdict is False:
            return GradeResult(INCORRECT)
        # None: the engine couldn't decide. Don't risk a false negative on a
        # possibly-correct answer — hand it back rather than mark it wrong.
        return GradeResult(INVALID, feedback=_MSG_UNGRADEABLE)
    except Exception:
        return GradeResult(INVALID, feedback=_MSG_UNREADABLE)


def grade_written_answer(correct: str, submitted: str) -> GradeResult:
    """Grade ``submitted`` against ``correct`` (both plain ASCII math).

    Wraps the SymPy work in a wall-clock timeout so a pathological input can't
    hang the request thread. On timeout we return INVALID (return the question
    to the learner) rather than guessing. The worker thread can't be force-killed
    in Python, so we abandon it with ``shutdown(wait=False)`` and return; with
    the input-length cap this path is effectively never hit for plain algebra.
    """
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(_grade, correct, submitted)
    try:
        return future.result(timeout=GRADING_TIMEOUT_SECONDS)
    except FuturesTimeoutError:
        return GradeResult(INVALID, feedback=_MSG_TIMEOUT)
    finally:
        executor.shutdown(wait=False)
