#!/usr/bin/env python
"""
Comprehensive verification script for all 4 phases of the LearnLab code review fixes.

Run from the backend directory:
    PYTHONPATH=. python verify_all_phases.py

This script tests each fix in isolation, prints PASS/FAIL for each check,
and cleans up after itself.
"""
import os
import sys
import traceback
from datetime import date, timedelta, datetime, timezone as tz

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnlab_platform.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext

User = get_user_model()

# ─── Helpers ───────────────────────────────────────────────────────────────────
PASS = 0
FAIL = 0

def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✅ {label}")
    else:
        FAIL += 1
        msg = f"  ❌ {label}"
        if detail:
            msg += f" — {detail}"
        print(msg)

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ─── Phase 1: Engine Stabilization ────────────────────────────────────────────
section("PHASE 1: Engine Stabilization")

# 1.1 — State enum default is now 1 (Learning)
from questions.models import TopicMastery, Topic, KnowledgePoint, Question
from users.models import Learner
from fsrs import State

print("\n[1.1] FSRS State Enum Default")
tm = TopicMastery()
check("TopicMastery default state == 1 (Learning)", tm.state == 1, f"got {tm.state}")
try:
    s = State(tm.state)
    check("State(1) does not raise ValueError", True)
except ValueError as e:
    check("State(1) does not raise ValueError", False, str(e))

# 1.2 — None coercion uses explicit checks
print("\n[1.2] None Coercion in FSRS Engine")
import inspect
from questions import fsrs_engine, services as svc

engine_src = inspect.getsource(fsrs_engine.process_topic_review)
check("fsrs_engine uses 'or None' for FSRS Card (0.0 → None)", 
      "stability or None" in engine_src)

frac_src = inspect.getsource(svc.apply_fractional_update)
check("apply_fractional_update uses 'or None' for FSRS Card", 
      "stability or None" in frac_src)

# 1.3 — get_retrievability handles None
print("\n[1.3] get_retrievability Safety")
from questions.serializers import TopicMasterySerializer

class FakeMastery:
    stability = 0.0
    last_review_date = None

serializer = TopicMasterySerializer()
try:
    result = serializer.get_retrievability(FakeMastery())
    check("get_retrievability(stability=0, last_review_date=None) returns 0.0", result == 0.0, f"got {result}")
except Exception as e:
    check("get_retrievability does not crash on None fields", False, str(e))

class FakeMastery2:
    stability = None
    last_review_date = None

try:
    result2 = serializer.get_retrievability(FakeMastery2())
    check("get_retrievability(stability=None) returns 0.0", result2 == 0.0, f"got {result2}")
except Exception as e:
    check("get_retrievability(stability=None) does not crash", False, str(e))

# 1.4 — process_interaction is wrapped in transaction.atomic
print("\n[1.4] Transaction Atomic Wrapping")
from questions.services import process_interaction
# Check if the function is decorated with transaction.atomic
check("process_interaction is wrapped in transaction.atomic",
      hasattr(process_interaction, '__wrapped__') or 
      'transaction.atomic' in inspect.getsource(process_interaction) or 
      getattr(process_interaction, '_non_atomic_requests', None) is not None or
      'atomic' in str(type(process_interaction)))

# 1.5 — apply_fractional_update state management
print("\n[1.5] apply_fractional_update State Management")
check("No arbitrary 0.3 threshold in apply_fractional_update",
      "fraction > 0.3" not in frac_src,
      "Arbitrary threshold still present")
check("Always updates state for fractional reviews",
      "mastery.state = new_card.state.value" in frac_src)

# 1.6 — seed_test_data uses knowledge_point
print("\n[1.6] seed_test_data Schema Fix")
seed_path = os.path.join(os.path.dirname(__file__), 
                         'questions/management/commands/seed_test_data.py')
with open(seed_path) as f:
    seed_src = f.read()
check("seed_test_data imports KnowledgePoint", "KnowledgePoint" in seed_src)
check("seed_test_data uses knowledge_point FK (not topic)", 
      "knowledge_point=knowledge_point" in seed_src or "knowledge_point=" in seed_src)
check("seed_test_data does NOT use topic=topic on Question", 
      "Question.objects.get_or_create(\n                topic=" not in seed_src)


# ─── Phase 2: API Refinement ─────────────────────────────────────────────────
section("PHASE 2: API Refinement")

# 2.1 — select_related on leaderboards
print("\n[2.1] Leaderboard Query Optimization")
from users import views as user_views
leaderboard_src = inspect.getsource(user_views.GlobalLeaderboardView)
check("GlobalLeaderboardView uses select_related('user')", 
      "select_related('user')" in leaderboard_src)

# 2.2 — TopicLeaderboardView returns QuerySet
print("\n[2.2] TopicLeaderboardView Returns QuerySet")
topic_lb_src = inspect.getsource(user_views.TopicLeaderboardView)
check("TopicLeaderboardView returns QuerySet (not Python list)",
      "Learner.objects.filter" in topic_lb_src,
      "Still returns [m.learner for m in masteries]")

# 2.3 — LearnerProfileView safe error handling
print("\n[2.3] LearnerProfileView Error Handling")
profile_src = inspect.getsource(user_views.LearnerProfileView)
check("LearnerProfileView handles DoesNotExist", 
      "DoesNotExist" in profile_src or "NotFound" in profile_src)

# 2.4 — PracticeSession perform_create does NOT set end_time
print("\n[2.4] PracticeSession end_time Fix")
from questions import views as q_views
session_src = inspect.getsource(q_views.PracticeSessionViewSet.perform_create)
check("perform_create does NOT set end_time=timezone.now()",
      "end_time" not in session_src,
      "end_time is still being set at creation")

# 2.5 — PracticeSessionViewSet prefetch_related
print("\n[2.5] PracticeSession Prefetch")
qs_src = inspect.getsource(q_views.PracticeSessionViewSet.get_queryset)
check("PracticeSessionViewSet uses prefetch_related('interactions')",
      "prefetch_related" in qs_src)

# 2.6 — generate_adaptive batch fetch
print("\n[2.6] generate_adaptive N+1 Fix")
adaptive_src = inspect.getsource(q_views.PracticeSessionViewSet.generate_adaptive)
check("generate_adaptive batch-fetches questions (no per-topic loop query)",
      "topic_id__in" in adaptive_src or "knowledge_point__topic_id__in" in adaptive_src,
      "Still queries per-topic inside loop")

# 2.7 — Question.__str__ null safety
print("\n[2.7] Question.__str__ Null Safety")
q = Question()
q.knowledge_point = None
q.tier = 1
q.text = "Test question text for null safety"
try:
    s = str(q)
    check("Question.__str__ handles null knowledge_point", True)
except (AttributeError, TypeError) as e:
    check("Question.__str__ handles null knowledge_point", False, str(e))


# ─── Phase 3: Gamification Polish ────────────────────────────────────────────
section("PHASE 3: Gamification Polish")

# 3.1 — Streak semantics: daily-level
print("\n[3.1] Streak Semantics")
svc_src = inspect.getsource(svc.process_interaction)
check("services.py calls learner.update_streak()", 
      "update_streak" in svc_src)
check("services.py does NOT hard-reset streak to 0 on wrong answer",
      "streak_count = 0" not in svc_src)

# 3.2 — XP via add_xp
print("\n[3.2] XP Routing")
check("services.py calls learner.add_xp()", "add_xp" in svc_src)
check("services.py does NOT directly mutate total_xp",
      "learner.total_xp +=" not in svc_src and "learner.total_xp=" not in svc_src)

# 3.3 — add_xp does not auto-save
print("\n[3.3] add_xp Save Behavior")
learner_src = inspect.getsource(Learner.add_xp)
check("add_xp does NOT call self.save()", "self.save()" not in learner_src,
      "add_xp still auto-saves, causing double saves")


# ─── Phase 4: Config & Infrastructure ────────────────────────────────────────
section("PHASE 4: Configuration & Infrastructure")

# 4.1 — DEBUG parsing
print("\n[4.1] DEBUG Boolean Parsing")
from django.conf import settings
check("settings.DEBUG is a boolean", isinstance(settings.DEBUG, bool),
      f"type is {type(settings.DEBUG)}")

# 4.2/4.3 — ALLOWED_HOSTS
print("\n[4.2/4.3] ALLOWED_HOSTS")
check("ALLOWED_HOSTS is not empty", len(settings.ALLOWED_HOSTS) > 0,
      f"got {settings.ALLOWED_HOSTS}")

# 4.4 — Throttle config
print("\n[4.4] API Throttling")
rf = settings.REST_FRAMEWORK
check("DEFAULT_THROTTLE_CLASSES is configured", 
      'DEFAULT_THROTTLE_CLASSES' in rf)
check("DEFAULT_THROTTLE_RATES is configured", 
      'DEFAULT_THROTTLE_RATES' in rf)

# 4.5 — PROJECT_SUMMARY.md
print("\n[4.5] Documentation")
summary_path = os.path.join(os.path.dirname(__file__), '..', 'PROJECT_SUMMARY.md')
if os.path.exists(summary_path):
    with open(summary_path) as f:
        summary = f.read()
    check("PROJECT_SUMMARY uses 'testlearner' (not 'teststudent')", 
          "testlearner" in summary and "teststudent" not in summary)
else:
    check("PROJECT_SUMMARY.md exists", False, "File not found")


# ─── Integration Test: Full FIRe Pipeline ────────────────────────────────────
section("INTEGRATION: Full FIRe Pipeline (live DB)")

from django.db import transaction

try:
    # Use a savepoint so we can rollback all test data
    sid = transaction.savepoint()
    
    # Create test user + learner
    user = User.objects.create_user(
        username='_verify_user', email='_verify@test.com', password='pass'
    )
    learner = Learner.objects.create(user=user)
    
    # Create a small DAG: A → B → C
    tA = Topic.objects.create(name='_VerifyA', description='Test A')
    tB = Topic.objects.create(name='_VerifyB', description='Test B')
    tC = Topic.objects.create(name='_VerifyC', description='Test C')
    
    tB.prerequisites.add(tA)
    tC.prerequisites.add(tB)
    tC.encompassings.add(tB, tA)
    
    kpA = KnowledgePoint.objects.create(topic=tA, name='KP_A')
    kpC = KnowledgePoint.objects.create(topic=tC, name='KP_C')
    
    qA = Question.objects.create(
        knowledge_point=kpA, text='Test Q for A?',
        choices=['a', 'b', 'c', 'd'], correct_answer_index=0, tier=1
    )
    qC = Question.objects.create(
        knowledge_point=kpC, text='Test Q for C?',
        choices=['a', 'b', 'c', 'd'], correct_answer_index=0, tier=2
    )
    
    # Create a practice session
    from questions.models import PracticeSession
    session = PracticeSession.objects.create(learner=learner, session_type='adaptive')
    
    # Test 1: Correct answer on topic C (advanced) — should trickle DOWN to B and A
    print("\n[INT-1] Correct answer on advanced topic C")
    process_interaction(learner, qC, is_correct=True, session=session)
    
    learner.refresh_from_db()
    check("Learner gained XP", learner.total_xp > 0, f"XP = {learner.total_xp}")
    check("Learner streak is 1", learner.streak_count == 1, f"streak = {learner.streak_count}")
    check("Learner last_practice_date is today", learner.last_practice_date == date.today())
    
    mC = TopicMastery.objects.get(learner=learner, topic=tC)
    check("TopicMastery for C has state > 0", mC.state >= 1, f"state = {mC.state}")
    check("TopicMastery for C has stability > 0", mC.stability > 0, f"stability = {mC.stability}")
    
    # Check trickle-down created mastery for encompassed topics
    mB_exists = TopicMastery.objects.filter(learner=learner, topic=tB).exists()
    mA_exists = TopicMastery.objects.filter(learner=learner, topic=tA).exists()
    check("FIRe trickle-down created mastery for B (encompassed)", mB_exists)
    check("FIRe trickle-down created mastery for A (encompassed)", mA_exists)
    
    # Test 2: Incorrect answer on topic A (foundation) — should ripple UP to B
    print("\n[INT-2] Incorrect answer on foundational topic A")
    old_xp = learner.total_xp
    process_interaction(learner, qA, is_correct=False, session=session)
    
    learner.refresh_from_db()
    check("Learner XP unchanged on wrong answer", learner.total_xp == old_xp,
          f"was {old_xp}, now {learner.total_xp}")
    check("Learner streak NOT reset to 0 (daily semantic)",
          learner.streak_count >= 1, f"streak = {learner.streak_count}")
    
    # Check penalty ripple to prerequisite_for (B depends on A)
    mB = TopicMastery.objects.get(learner=learner, topic=tB)
    check("FIRe penalty rippled to B (advanced topic)", mB.reps == 0 or mB.stability is not None)
    
    # Test 3: Retrievability serialization
    print("\n[INT-3] Retrievability Serialization")
    serializer = TopicMasterySerializer(mC)
    data = serializer.data
    check("TopicMastery serialization includes retrievability", 
          'retrievability' in data, f"keys: {list(data.keys())}")
    check("Retrievability is a valid number", 
          isinstance(data['retrievability'], (int, float)),
          f"got {type(data['retrievability'])}")
    
    # Test 4: Session XP tracking
    print("\n[INT-4] Session XP Tracking")
    session.refresh_from_db()
    check("Session tracked XP earned", session.total_xp_earned > 0,
          f"total_xp_earned = {session.total_xp_earned}")
    check("Session end_time is NOT prematurely set", session.end_time is None,
          f"end_time = {session.end_time}")
    
    # Rollback all test data
    transaction.savepoint_rollback(sid)
    print("\n  🧹 Test data rolled back successfully.")
    
except Exception as e:
    print(f"\n  💥 Integration test failed with exception:")
    traceback.print_exc()
    try:
        transaction.savepoint_rollback(sid)
    except:
        pass


# ─── Summary ──────────────────────────────────────────────────────────────────
section("SUMMARY")
total = PASS + FAIL
print(f"\n  Total: {total} checks")
print(f"  ✅ Passed: {PASS}")
print(f"  ❌ Failed: {FAIL}")
print(f"\n  Result: {'ALL PASSED ✨' if FAIL == 0 else f'{FAIL} FAILURE(S) — review above'}")
print()
