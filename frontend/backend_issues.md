# LearnLab Backend Issues & Suggestions (API Audit)

> **For the backend team.** This document tracks unresolved API suggestions, architectural improvements, and security warnings, as well as successfully completed milestones for the LearnLab Django backend, as compiled by the frontend engineering team.
>
> **Latest verification:** 2026-06-17 on `interface` at `fc506ca`.

---

## 🔴 Critical Active Blockers (Immediate Fixes Required)

### 1. Bulk practice session create documents the wrong nested response shape

- **Status:** Active backend contract blocker, still verified 2026-06-17 on `interface` at `fc506ca`
- **Affected contract:** `POST /api/v1/practice/sessions/` with non-empty nested `responses`
- **Symptoms:** `PracticeSessionCreateSerializer.responses` is wired to `QuestionCreateAndUpdateSerializer(many=True)` even though `create()` reads each row as a `QuestionResponse` payload using `response_data['question']` and `response_data['selected_answer_index']`.
- **Smoke result:** Generated OpenAPI schema for `PracticeSessionCreate.responses[]` still references `QuestionCreateAndUpdate` instead of `QuestionResponseCreate`. Runtime APIClient smoke with `{"responses":[{"question":"<uuid>","selected_answer_index":0}]}` returned `400` with required-field errors for `text` and `correct_answer_index`.
- **Impact:** The published bulk session-create contract asks clients for question-authoring fields, while runtime code expects answer-submission fields. The current frontend avoids this by creating sessions with `responses: []` and submitting answers through `/practice/sessions/<id>/responses/`.
- **Recommendation:** Change `PracticeSessionCreateSerializer.responses` back to `QuestionResponseCreateSerializer(many=True, required=False)`, keep XP awarding centralized on completion, and regenerate the schema.

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

- **Status:** Resolved, verified 2026-06-13
- **Description:** The backend now sets `CORS_ALLOW_ALL_ORIGINS = DEBUG` and requires `CORS_ALLOWED_ORIGINS` in production mode.
- **Recommendation:** Keep production origin configuration environment-driven.

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

- **Status:** Implemented upstream / monitor
- **Description:** The student and admin analytics dashboards aggregate telemetry datasets (topics, difficulty tier breakdowns, and activity time-series). Under high concurrency (e.g., during active exams or lectures), repeated aggregation queries will place unnecessary database load on PostgreSQL.
- **Verification note:** Backend merge `8329e3a` added Redis-backed caching. The current 2026-06-16 contract audit did not observe the earlier Redis import failure; the active leaderboard problem is now tracked separately as a missing `/api/v1/practice/leaderboard/` route returning `404`.
- **Recommendation:** Keep local and deployment environments aligned with the updated backend dependencies and Redis/cache configuration.

### 10. OpenAPI documentation completeness for auth/practice/analytics

- **Status:** Mostly resolved / one remaining non-blocking schema warning, verified 2026-06-17 on `interface` at `fc506ca`
- **Description:** `manage.py spectacular --validate` completes with zero errors and one warning: `PracticeSessionViewSet` path parameter `id` still cannot be derived cleanly and defaults to string. Earlier password-reset serializer and analytics operationId warnings are no longer present.
- **Impact:** Frontend contract audits can still inspect runtime behavior, but generated OpenAPI remains noisy and partially misleading.
- **Recommendation:** Finish annotating the practice session path parameter so generated OpenAPI is warning-free.

---

## 🟡 Active Warnings

### 1. Cryptographic Signing Key Length Warning (Security)

- **Status:** Active Warning
- **Description:** During local environment boots, the Django development server emits an insecure signing warning from SimpleJWT:
  `InsecureKeyLengthWarning: The key length (16 bytes) is insecure...`
  This is caused by the environment variable `SECRET_KEY` in `backend/.env` being under 32 bytes (256-bit strength).
- **Recommendation:** Update `SECRET_KEY` (and `SIGNING_KEY` if configured separately) to a high-entropy string of at least 32 bytes in the server environment config.

---

## 🎉 Previously Resolved Integration Milestones

The following integration milestones have been verified. They do not override any future active blockers listed above.

### 1. Leaderboard endpoint restored

- **Status:** ✅ Resolved, verified 2026-06-17 on `interface` at `fc506ca`
- **Verification:** `GET /api/v1/practice/leaderboard/` is mounted again and authenticated APIClient smoke returned `200` with learner-safe fields: `username`, `current_xp`, and `streak_count`. No backend IDs are exposed in the leaderboard payload.

### 2. Admin question reads include `correct_answer_index`

- **Status:** ✅ Resolved, verified 2026-06-17 on `interface` at `fc506ca`
- **Verification:** Learner `GET /api/v1/practice/questions/` still omits `correct_answer_index`, while staff/admin `GET /api/v1/practice/questions/` includes it through `QuestionAdminSerializer`. This preserves learner answer safety and unblocks admin preview/edit.

### 3. Missing `selected_answer_index` migration

- **Status:** ✅ Resolved, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Verification:** `backend/practice/migrations/0003_questionresponse_selected_answer_index.py` is now committed. `manage.py makemigrations --check --dry-run` returns `No changes detected`. Local `manage.py migrate --check` may still fail until the newly committed migrations are applied to the local database.

### 4. Bulk practice session submission double-award risk

- **Status:** ✅ Resolved, verified by serializer audit 2026-06-16 after merging `origin/master` at `d841620`
- **Verification:** `PracticeSessionCreateSerializer.create()` now stores `session.total_xp_earned` only and no longer increments `learner.current_xp`, streak, or `last_practice_date`. Learner aggregate XP/streak awarding remains centralized in `PracticeSessionSerializer.update()` when `end_time` completes the session.

### 5. Backend email environment import failure

- **Status:** ✅ Resolved, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Verification:** `settings.py` now uses `EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))`, `EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS') == 'True'`, and `backend/.env.example` documents the email variables. `manage.py check` passes without supplying `EMAIL_PORT` in the shell.

### 6. Password reset request response no longer exposes reset credentials

- **Status:** ✅ Resolved, verified 2026-06-15 after backend merge `a7ad281`
- **Verification:** APIClient smoke with an existing account and a missing email returned `200` with the same response keys: `['message']`. No `uid` or `token` keys were returned in JSON. The frontend request flow at `/forgot-password` ignores response credentials, and the reset confirmation route `/reset-password?uid=...&token=...` now posts the emailed credentials to `/auth/password-reset/confirm/`.

### 7. Adaptive session generation serializer field omission

- **Status:** ✅ Resolved, verified 2026-06-15 after backend merge `a7ad281`
- **Verification:** `QuestionSerializer.Meta.fields` now includes `subtopic_name`. Authenticated APIClient smoke for `GET /api/v1/practice/sessions/generate-adaptive/` returned `200` with `questions` and `message`.

### 8. Current User Serializer Date Field

- **Status:** ✅ Resolved, verified 2026-06-13
- **Verification:** `UserDetailSerializer` now exposes `date_joined` instead of the removed `joined_at` field. Smoke test: authenticated `GET /api/v1/auth/users/me/` returned `200`, included `date_joined`, and did not include `joined_at`.

### 9. Adaptive Session Generation UUID/Subtopic Query Bug

- **Status:** ✅ Resolved, verified 2026-06-13
- **Verification:** `GenerateAdaptiveSessionView` now queries due questions with `subtopic_id__in=due_subtopic_ids` and orders by `q.subtopic_id`. Smoke test: authenticated `GET /api/v1/practice/sessions/generate-adaptive/` returned `200` with `questions` and `message`.

### 10. Practice Session Creation Returns `id`

- **Status:** ✅ Resolved, verified 2026-06-13
- **Verification:** `PracticeSessionCreateSerializer` now includes `id` in its response fields after remote merge commit `dcda7f0`. Smoke test: authenticated `POST /api/v1/practice/sessions/` with `{ "responses": [] }` returned `201` with `id` and `responses`, allowing the frontend to submit nested responses against the newly created session.

### 11. Practice Session Completion XP Awarding Bug (Critical Bug)

- **Status:** ✅ Resolved
- **Verification:** The backend `PracticeSessionSerializer` now overrides `update()` to award the learner's `current_xp` and increment their practice streak upon session completion (PATCH request with `end_time`).

### 12. Interactive Practice Response Submission Endpoint

- **Status:** ✅ Resolved
- **Verification:** Nested response route `POST /practice/sessions/<uuid:id>/responses/` handles live student practice answers, successfully writing `QuestionResponse` tables and instantly updating FSRS memory mastery metrics and XP scores.

### 13. Bulk & Time-Series Analytics Telemetry

- **Status:** ✅ Resolved
- **Verification:** Dedicated aggregated endpoints `/analytics/topics/`, `/analytics/activity/`, and `/analytics/difficulty/` are fully active, powering the admin metrics, difficulty progress rings, and dynamically loaded weekly trends.

### 14. Curriculum Questions Counts

- **Status:** ✅ Resolved
- **Verification:** `/topics/` responses expose computed `question_count` properties. The older backend grouping field has been removed from the contract as of the latest merge; frontend grouping is now derived client-side using category naming.

### 15. Topic Typo Resolution (`/topics/`)

- **Status:** ✅ Resolved
- **Verification:** The backend has stabilized the URL scheme to `/topics/`, letting the frontend service layers transition fully away from `/topcis/` fallbacks.

### 16. User Initials and Avatar Colors in Token Response

- **Status:** ✅ Resolved
- **Verification:** `/auth/login/` returns stable, computed `initials` (e.g., `"JD"`) and design-tailored `avatar_color` HSL coordinates (e.g., `"hsl(210, 70%, 50%)"`). `/auth/users/me/` now also uses the fixed `date_joined` serializer field.
