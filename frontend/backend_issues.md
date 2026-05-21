# LearnLab Backend Issues & Suggestions (API Audit)

> **For the backend team.** This document tracks unresolved API suggestions, architectural improvements, and security warnings, as well as successfully completed milestones for the LearnLab Django backend, as compiled by the frontend engineering team.

---

## 🔴 Critical Active Blockers (Immediate Fixes Required)

These issues are current blockers that crash the API with a **500 Internal Server Error** under normal user flows. The frontend is fully integrated and tested, but is blocked by these database/import level issues.

### 1. FSRS Adaptive Session Generation `FieldError` (Blocks Practice Initialization)
- **Status:** 🔴 Active Blocker (Critical Bug)
- **Location:** `backend/practice/views.py` (inside `GenerateAdaptiveSessionView.get()`)
- **Description:** Attempting to start an adaptive practice session via `GET /practice/sessions/generate-adaptive/` crashes the backend with a **500 Internal Server Error**. The Django log reports:
  ```text
  django.core.exceptions.FieldError: Cannot resolve keyword 'next_review' into field. Join on 'subtopic' yields 'Subtopic', which does not have 'next_review' as an attribute.
  ```
  This is caused by trying to order the query directly by `subtopic__next_review` on the `Question` model:
  ```python
  # Crashes because 'next_review' resides in SubtopicMastery, NOT Subtopic
  due_questions = list(
      Question.objects.filter(subtopic_id__in=due_subtopic_ids)
      .order_by('subtopic__next_review')[:limit]
  )
  ```
- **Fix Recommendation:** Fetch the questions in the due subtopics and sort them in Python memory using the pre-sorted indices of `due_subtopic_ids`:
  ```python
  # Fetch the candidate questions
  due_questions_qs = Question.objects.filter(subtopic_id__in=due_subtopic_ids)
  # Map subtopic IDs to their sorted position in the due list
  subtopic_order_map = {sid: idx for idx, sid in enumerate(due_subtopic_ids)}
  # Sort in memory using the mapping to bypass the ORM compilation FieldError
  due_questions = sorted(
      due_questions_qs,
      key=lambda q: subtopic_order_map.get(q.subtopic_id, 9999)
  )[:limit]
  ```

### 2. Critical `ImportError` in `fsrs_engine.py` (Blocks Practice Progress & XP Updates)
- **Status:** 🔴 Active Blocker (Critical Bug)
- **Location:** `backend/practice/fsrs_engine.py` (line 5)
- **Description:** Whenever a user submits a practice answer (`POST /practice/sessions/<uuid:id>/responses/`), the server crashes with a **500 Internal Server Error**. The traceback shows:
  ```text
  ImportError: cannot import name 'SubtopicMastery' from 'practice.models' (C:\organize2\learnlab_platform\backend\practice\models.py)
  ```
  The crash occurs because the FSRS engine attempts to import `SubtopicMastery` from `practice.models` on line 5:
  ```python
  from practice.models import QuestionResponse, Subtopic, SubtopicMastery
  ```
  However, both `Subtopic` and `SubtopicMastery` are defined in the `topics.models` module, NOT `practice.models`.
- **Fix Recommendation:** Correct the import statements in `backend/practice/fsrs_engine.py` to point to their actual native locations:
  ```python
  from practice.models import QuestionResponse
  from topics.models import Subtopic, SubtopicMastery
  ```
  *This simple fix will unblock answer submission, allowing responses to be saved, spaced repetition states to progress, and XP to update seamlessly.*

---

## 🟢 Newly Identified Suggestions & Improvements

### 1. Backend-Side XP Validation on Practice Session Finalization (Anti-Cheat)
- **Status:** Suggestion (High Value / Security)
- **Description:** Currently, when completing a practice session, the frontend submits a `PATCH` request to `/practice/sessions/<id>/` containing `total_xp_earned`. The backend `PracticeSessionSerializer.update` trusts this client-side value and increments the user's `current_xp` by this amount. This introduces a vulnerability where a user can send a modified, inflated `total_xp_earned` payload to artificially boost their XP on the leaderboard.
- **Recommendation:** Calculate the XP earned dynamically on the server-side upon session finalization by counting the verified correct `QuestionResponse` records linked to that session in the database:
  ```python
  # Instead of: learner.current_xp += total_xp_earned
  correct_responses = instance.responses.filter(is_correct=True).count()
  earned_xp = correct_responses * 10
  learner.current_xp += earned_xp
  ```

### 2. Complete FSRS-5 Mathematical Scheduling Algorithm (Transition from Stub)
- **Status:** Suggestion (High Value / Spaced Repetition)
- **Description:** The spacing engine in `backend/practice/fsrs_engine.py` currently relies on a simple multiplier stub (e.g., doubling `stability` on a correct response, or cutting it in half on a lapse). To achieve true adaptive spaced repetition, the system should leverage the full FSRS-5 mathematical formulas.
- **Recommendation:** Implement the full FSRS-5 mathematical equations in `fsrs_engine.py` (utilizing the 17 parameters to compute stability, difficulty, and retrievability based on confidence ratings and actual elapsed days).

### 3. Conditional CORS Origin Restraints in Production Settings
- **Status:** Security Suggestion
- **Description:** The backend `settings.py` currently has `CORS_ALLOW_ALL_ORIGINS = True` hardcoded. While helpful for local development across various hostnames, allowing all origins globally is insecure for production environments.
- **Recommendation:** Restrict wildcard origins to local development mode by setting `CORS_ALLOW_ALL_ORIGINS = DEBUG` and configuring production hostnames in `CORS_ALLOWED_ORIGINS`.

### 4. Admin Audit Logs API (`GET /admin/audit-logs/`)
- **Status:** Suggestion (High Value)
- **Description:** Currently, the Admin Profile page contains no dynamic feed for administrative actions. As the platform transitions to a multi-administrator layout, tracking resource modifications is critical for platform compliance, accountability, and debugging.
- **Recommendation:** Expose a read-only endpoint `/admin/audit-logs/` that provides a time-series log of all administrative actions (e.g., questions created/modified/deleted, new topics registered, system settings updated). The JSON payload should structure:
  ```json
  [
    {
      "id": "uuid",
      "actor": { "id": "admin_uuid", "username": "admin" },
      "action_type": "question_create",
      "description": "Added Propositional Logic question (Tier 2)",
      "timestamp": "2026-05-21T10:45:00Z"
    }
  ]
  ```

### 5. User Preferences & Settings Persistence API
- **Status:** Suggestion
- **Description:** System options like interface language preference, dark mode state, and notification settings (email digests, leaderboard alerts) are currently processed and saved locally in `localStorage`. If a user logs in from a different device, their settings are reset.
- **Recommendation:** Provide a preferences persistence endpoint under the User profile, e.g., `PATCH /auth/users/me/preferences/` or `/settings/`, allowing a simple JSON metadata payload to be stored in the database.

### 6. Server-Side Token Revocation on Logout (`POST /auth/logout/`)
- **Status:** Security Suggestion
- **Description:** The client currently executes logout operations by wiping token strings from local memory. However, active JWT tokens remain cryptographically valid until their expiry time.
- **Recommendation:** Implement a server-side logout route using SimpleJWT's token blacklist feature (`POST /auth/logout/` or similar) that accepts the active refresh token and blacklists it, preventing subsequent access requests.

### 7. SimpleJWT SSO / Social OAuth Endpoints
- **Status:** Architecture Suggestion
- **Description:** The platform currently relies solely on local email/username credential pairs. Adding support for SSO (e.g. Google Workspace, Microsoft Azure AD, or Github OAuth) would simplify academic onboarding.
- **Recommendation:** Mount Django-allauth or djangorestframework-simplejwt token authentication endpoints supporting social sign-ins (e.g. `/auth/google/login/`).

### 8. System Health Telemetry API (`GET /admin/system-health/`)
- **Status:** Suggestion (Nice to Have)
- **Description:** During our integration pass, we removed simulated/mock dials (CPU/Memory percentages) from the Admin Dashboard and Admin Profile page. To allow administrators to monitor live operational feedback without configuring complex external APM software, a simple telemetry endpoint is needed.
- **Recommendation:** Expose a read-only `GET /admin/system-health/` API endpoint returning CPU usage, memory consumption, storage space, PostgreSQL connection health, and average API response latency.

### 9. Short-Lived Redis Caching for Analytics Routes (`/analytics/*`)
- **Status:** Optimization Suggestion
- **Description:** The student and admin analytics dashboards aggregate telemetry datasets (topics, difficulty tier breakdowns, and activity time-series). Under high concurrency (e.g., during active exams or lectures), repeated aggregation queries will place unnecessary database load on PostgreSQL.
- **Recommendation:** Implement a short-lived Redis cache (e.g., 5-minute Time-To-Live) for the `GET /analytics/*` endpoints. These charts do not require second-by-second accuracy to be effective.

---

## 🟡 Active Warnings

### 1. Cryptographic Signing Key Length Warning (Security)
- **Status:** Active Warning
- **Description:** During local environment boots, the Django development server emits an insecure signing warning from SimpleJWT:
  `InsecureKeyLengthWarning: The key length (16 bytes) is insecure...`
  This is caused by the environment variable `SECRET_KEY` in `backend/.env` being under 32 bytes (256-bit strength).
- **Recommendation:** Update `SECRET_KEY` (and `SIGNING_KEY` if configured separately) to a high-entropy string of at least 32 bytes in the server environment config.

---

## 🎉 Successfully Resolved Integration Milestones

All critical blockers and previous suggestions from our early integrations have been **fully resolved** by the backend engineering team! Excellent work on these!

### 1. Practice Session Completion XP Awarding Bug (Critical Bug)
- **Status:** ✅ Resolved
- **Verification:** The backend `PracticeSessionSerializer` now overrides `update()` to award the learner's `current_xp` and increment their practice streak upon session completion (PATCH request with `end_time`).

### 2. Interactive Practice Response Submission Endpoint
- **Status:** ✅ Resolved
- **Verification:** Nested response route `POST /practice/sessions/<uuid:id>/responses/` handles live student practice answers, successfully writing `QuestionResponse` tables and instantly updating FSRS memory mastery metrics and XP scores.



### 4. Bulk & Time-Series Analytics Telemetry
- **Status:** ✅ Resolved
- **Verification:** Dedicated aggregated endpoints `/analytics/topics/`, `/analytics/activity/`, and `/analytics/difficulty/` are fully active, powering the admin metrics, difficulty progress rings, and dynamically loaded weekly trends.

### 5. Curriculum Questions Counts and Grouping
- **Status:** ✅ Resolved
- **Verification:** `/topics/` responses now correctly expose computed `question_count` properties and `parent_module` grouping fields.

### 6. Topic Typo Resolution (`/topics/`)
- **Status:** ✅ Resolved
- **Verification:** The backend has stabilized the URL scheme to `/topics/`, letting the frontend service layers transition fully away from `/topcis/` fallbacks.

### 7. User Initials and Avatar Colors in Token Response
- **Status:** ✅ Resolved
- **Verification:** `/auth/users/me/` and `/auth/login/` endpoints now return stable, computed `initials` (e.g., `"JD"`) and beautiful design-tailored `avatar_color` HSL coordinates (e.g., `"hsl(210, 70%, 50%)"`). This enables clean client-side dynamic avatar generation without mock colors.
