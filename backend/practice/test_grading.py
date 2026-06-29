"""Tests for the written-answer CAS grader (practice.grading).

Pure SymPy logic — no database — so it runs standalone:

    uv run python -m unittest practice.test_grading -v

(It's also picked up by ``manage.py test practice`` as a normal test module.)
"""
import unittest

from practice.grading import grade_written_answer, CORRECT, INCORRECT, INVALID


class GradeWrittenAnswerTests(unittest.TestCase):
    def _assert(self, correct, submitted, expected):
        result = grade_written_answer(correct, submitted)
        self.assertEqual(
            result.outcome, expected,
            msg=f"grade({correct!r}, {submitted!r}) -> {result.outcome} (expected {expected}); feedback={result.feedback!r}",
        )

    def test_equivalent_forms_are_correct(self):
        cases = [
            ("2*x", "x+x"),            # the canonical case
            ("2x", "x+x"),            # implicit multiplication on the key side too
            ("2x", "2*x"),            # implicit vs explicit multiply
            ("x^2-1", "(x-1)(x+1)"),  # factored vs expanded
            ("(x+1)^2", "x^2+2x+1"),  # expand a square
            ("1/2", "0.5"),           # rational vs decimal
            ("x/2", "0.5x"),          # fraction vs decimal coefficient
            ("sqrt(x)", "x^(1/2)"),   # radical vs fractional power
            ("6", "3+3"),             # pure numeric
            ("3/6", "1/2"),           # unsimplified fraction
        ]
        for correct, submitted in cases:
            with self.subTest(correct=correct, submitted=submitted):
                self._assert(correct, submitted, CORRECT)

    def test_equations_are_correct(self):
        cases = [
            ("x=2", "2=x"),    # sides flipped
            ("2x=4", "x=2"),   # scaled equivalent equation
            ("y=2x", "y=x+x"), # equivalent both sides
        ]
        for correct, submitted in cases:
            with self.subTest(correct=correct, submitted=submitted):
                self._assert(correct, submitted, CORRECT)

    def test_genuinely_different_answers_are_incorrect(self):
        cases = [
            ("2x", "2y"),     # different variable
            ("x+1", "x+2"),   # off by a constant
            ("x=2", "x=3"),   # different solution
            ("x^2", "x^3"),   # different power
            ("x=2", "x"),     # equation vs expression mismatch
        ]
        for correct, submitted in cases:
            with self.subTest(correct=correct, submitted=submitted):
                self._assert(correct, submitted, INCORRECT)

    def test_unparseable_submissions_are_invalid(self):
        # INVALID = hand back to the learner, never counted wrong.
        for bad in ["2x+", "", "   ", "((", ")(", "* 3", "x +/ 2"]:
            with self.subTest(submitted=bad):
                self._assert("2*x", bad, INVALID)

    def test_unparseable_answer_key_is_invalid(self):
        # An authoring mistake should surface as INVALID, not silently "wrong".
        self._assert("@#$", "2x", INVALID)

    def test_overlong_input_is_invalid(self):
        self._assert("2*x", "x+" * 500, INVALID)

    def test_invalid_never_marked_correct_or_incorrect(self):
        result = grade_written_answer("2*x", "2x+")
        self.assertTrue(result.is_invalid)
        self.assertFalse(result.is_correct)
        self.assertTrue(result.feedback)  # learner-facing message present


if __name__ == "__main__":
    unittest.main()
