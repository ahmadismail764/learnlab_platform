# LearnLab Backend Issues & Suggestions (API Audit)

> **For the backend team.** This document tracks unresolved API suggestions, architectural improvements, and security warnings, as well as successfully completed milestones for the LearnLab Django backend, as compiled by the frontend engineering team.

---

## 🔴 Critical Active Blockers (Immediate Fixes Required)

### 1. `/auth/users/me/` returns non-200 during auth hydration

- **Status:** Active blocker
- **Symptoms:** Frontend logs `Failed to hydrate user Error: Failed to fetch current user from /auth/users/me/.` immediately after login.
- **Impact:** Auth context cannot hydrate reliably, causing unexpected logout or cached fallback state.
- **Repro:** Log in, then call `GET /api/v1/auth/users/me/` with `Authorization: Bearer <access>`.
- **Recommendation:** Ensure the endpoint returns `200` with `UserDetailSerializer` and confirm JWT auth/permissions are applied.

### 2. Adaptive session generation endpoint fails

- **Status:** Active blocker
- **Symptoms:** Frontend throws `Failed to generate adaptive session` when starting practice.
- **Impact:** Learners cannot start practice sessions.
- **Backend source:** `GenerateAdaptiveSessionView` filters questions with `Question.objects.filter(id=due_subtopic_ids)` and sorts by `q.id`. It should filter by `subtopic_id__in` and order using `q.subtopic_id`.
- **Recommendation:** Update the query and ordering to match subtopic IDs.

### 3. Incorrect import paths in practice modules

- **Status:** Active blocker
- **Symptoms:** `ModuleNotFoundError: No module named 'constants'` or `ImportError` for `Subtopic` when practice endpoints execute.
- **Backend source:** `practice/serializers.py` + `practice/views.py` import `from constants import XP_PER_CORRECT_ANSWER` but the module is `practice.constants`. `practice/fsrs_engine.py` imports `Subtopic` from `practice.models` but it lives in `topics.models`.
- **Recommendation:** Fix import paths to the correct modules.

---

## 🟢 Newly Identified Suggestions & Improvements

### 1. Backend-Side XP Validation on Practice Session Finalization (Anti-Cheat)

- **Status:** Resolved backend invariant / monitor
- **Description:** Earlier frontend builds submitted `total_xp_earned` during session completion, which would have allowed a modified client payload to inflate XP if trusted by the backend. The current frontend now sends only `end_time` on completion and relies on verified `QuestionResponse` rows for XP.
- **Recommendation:** Keep XP calculation fully server-side by counting the verified correct `QuestionResponse` records linked to the session:
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

### 3. Bulk & Time-Series Analytics Telemetry

- **Status:** ✅ Resolved
- **Verification:** Dedicated aggregated endpoints `/analytics/topics/`, `/analytics/activity/`, and `/analytics/difficulty/` are fully active, powering the admin metrics, difficulty progress rings, and dynamically loaded weekly trends.

### 4. Curriculum Questions Counts and Grouping

- **Status:** ✅ Resolved
- **Verification:** `/topics/` responses now correctly expose computed `question_count` properties and `parent_module` grouping fields.

### 5. Topic Typo Resolution (`/topics/`)

- **Status:** ✅ Resolved
- **Verification:** The backend has stabilized the URL scheme to `/topics/`, letting the frontend service layers transition fully away from `/topcis/` fallbacks.

### 6. User Initials and Avatar Colors in Token Response

- **Status:** ✅ Resolved
- **Verification:** `/auth/users/me/` and `/auth/login/` endpoints now return stable, computed `initials` (e.g., `"JD"`) and beautiful design-tailored `avatar_color` HSL coordinates (e.g., `"hsl(210, 70%, 50%)"`). This enables clean client-side dynamic avatar generation without mock colors.
