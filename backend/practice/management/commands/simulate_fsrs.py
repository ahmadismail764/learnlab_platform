"""Dry-run the FSRS v1 scheduler so teammates can see the intervals it produces.

This touches no database — it runs the same scheduling core the live engine uses
against an in-memory mastery record, so it's safe to run anywhere.

Examples
--------
    # A learner who gets everything right for 8 reviews:
    python manage.py simulate_fsrs --reviews 8

    # A specific answer sequence (1 = correct, 0 = wrong):
    python manage.py simulate_fsrs --answers 1,1,1,0,1,1

    # Try a different aggressiveness without editing constants:
    python manage.py simulate_fsrs --reviews 8 --speed 0.5
"""
from types import SimpleNamespace

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

import fsrs
from practice.constants import LEARNING_SPEED, MAX_INTERVAL_DAYS
from practice.fsrs_engine import preview_schedule


class Command(BaseCommand):
    help = "Simulate the FSRS v1 scheduler and print the review intervals it produces."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reviews', type=int, default=8,
            help="Number of all-correct reviews to simulate (ignored if --answers is given).",
        )
        parser.add_argument(
            '--answers', type=str, default=None,
            help="Comma-separated answers, 1=correct/0=wrong, e.g. 1,1,0,1.",
        )
        parser.add_argument(
            '--speed', type=float, default=LEARNING_SPEED,
            help=f"Math Academy fractional speed (default {LEARNING_SPEED}).",
        )
        parser.add_argument(
            '--max-cap', type=float, default=MAX_INTERVAL_DAYS,
            help=f"Maximum interval in days (default {MAX_INTERVAL_DAYS}).",
        )

    def handle(self, *args, **options):
        speed = options['speed']
        max_cap = options['max_cap']
        if options['answers']:
            try:
                answers = [bool(int(x)) for x in options['answers'].split(',') if x.strip()]
            except ValueError:
                raise CommandError("--answers must be comma-separated 0/1 values, e.g. 1,1,0,1")
        else:
            answers = [True] * options['reviews']

        # In-memory stand-in for SubtopicMastery (no DB needed).
        mastery = SimpleNamespace(
            state='NEW', stability=None, difficulty=None,
            last_review=None, next_review=None,
        )
        now = timezone.now()

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"FSRS v1 simulation  (speed={speed}, max_cap={max_cap}d, "
            f"desired_retention=0.9, no Hard seed)"
        ))
        self.stdout.write(f"{'#':>3}  {'answer':<8}{'rating':<8}{'interval':>12}  "
                          f"{'stability':>10}  {'difficulty':>10}  state")

        for i, correct in enumerate(answers, 1):
            rating = fsrs.Rating.Good if correct else fsrs.Rating.Again
            result = preview_schedule(
                mastery, rating, speed=speed, now=now, max_interval_days=max_cap,
            )

            iv = result['interval_days']
            iv_str = f"{iv * 24:.1f}h" if iv < 1 else f"{iv:.2f}d"
            self.stdout.write(
                f"{i:>3}  {'correct' if correct else 'WRONG':<8}{rating.name:<8}"
                f"{iv_str:>12}  {result['stability']:>10.3f}  "
                f"{result['difficulty']:>10.3f}  {result['state']}"
            )

            # Advance: roll our in-memory mastery forward to the new due date.
            mastery.state = result['state']
            mastery.stability = result['stability']
            mastery.difficulty = result['difficulty']
            mastery.last_review = result['last_review']
            mastery.next_review = result['due']
            now = result['due']
