# LearnLab Backend-Owned Issues & Integration Notes (Frontend Audit)

> **For the backend team.** This document separates true backend-owned problems from frontend/product integration notes. If the backend already provides a working contract and the frontend was not consuming it, that is **not** listed as a backend issue.
>
> **Latest verification:** 2026-06-16 on `interface` after merging `origin/master` at `d841620`.

---

## Backend-Owned Issues / Contract Risks

### 1. Leaderboard endpoint is missing from the merged backend URL contract

- **Status:** Active backend contract blocker, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Affected contract:** `GET /api/v1/practice/leaderboard/` and `GET /api/v1/practice/leaderboard/?topic=<uuid>`
- **Symptoms:** The frontend leaderboard pages and admin dashboard consume `/practice/leaderboard/`, but `backend/practice/urls.py` no longer mounts `LeaderboardView`, and generated OpenAPI paths do not include a leaderboard endpoint.
- **Smoke result:** Authenticated APIClient smoke returned `404` for `GET /api/v1/practice/leaderboard/`.
- **Impact:** Learner leaderboard, topic leaderboard, and admin dashboard learner counts cannot consume a backend leaderboard contract. The frontend now surfaces this failure instead of returning a fake empty leaderboard.
- **Recommendation:** Re-mount a learner-safe leaderboard endpoint under `/api/v1/practice/leaderboard/` or publish the replacement endpoint and response contract.

### 2. Admin question reads omit `correct_answer_index`, blocking accurate preview/edit

- **Status:** Active backend contract blocker, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Affected contract:** `GET /api/v1/practice/questions/` and `GET /api/v1/practice/questions/<uuid:id>/`
- **Symptoms:** `QuestionViewSet` uses `QuestionSerializer` for all list/retrieve requests. That serializer intentionally excludes `correct_answer_index`, which is correct for learners but also affects admin reads.
- **Smoke result:** Authenticated APIClient smoke for `GET /api/v1/practice/questions/` returned question keys `['choices', 'id', 'subtopic', 'subtopic_name', 'text', 'tier', 'tier_display']`; `correct_answer_index` was absent.
- **Impact:** Admin question preview cannot identify the correct answer, and editing an existing question cannot safely preserve the current correct answer. The frontend no longer fabricates index `0`, so this backend omission is visible.
- **Recommendation:** Use an admin-specific read serializer for staff users or expose a dedicated admin question endpoint that includes `correct_answer_index` while keeping learner-facing practice/adaptive question responses answer-safe.

### 3. Bulk practice session create documents the wrong nested response shape

- **Status:** Active backend contract blocker, verified by schema/serializer audit 2026-06-16 after merging `origin/master` at `d841620`
- **Affected contract:** `POST /api/v1/practice/sessions/` with non-empty nested `responses`
- **Symptoms:** `PracticeSessionCreateSerializer.responses` is wired to `QuestionCreateAndUpdateSerializer(many=True)` even though `create()` reads each row as a `QuestionResponse` payload using `response_data['question']` and `response_data['selected_answer_index']`.
- **Smoke result:** Generated OpenAPI schema for `PracticeSessionCreate.responses[]` references `QuestionCreateAndUpdate` instead of `QuestionResponseCreate`.
- **Impact:** The published bulk session-create contract asks clients for question-authoring fields, while runtime code expects answer-submission fields. The current frontend avoids this by creating sessions with `responses: []` and submitting answers through `/practice/sessions/<id>/responses/`.
- **Recommendation:** Change `PracticeSessionCreateSerializer.responses` back to `QuestionResponseCreateSerializer(many=True, required=False)`, keep XP awarding centralized on completion, and regenerate the schema.

---

## Optional Product Enhancements — Not Backend Bugs

### Leaderboard Rich Display Fields

- **Status:** Frontend/product enhancement note, not a backend defect
- **Current backend contract:** `GET /api/v1/leaderboard/` returns ranked learner standings with `username`, `current_xp`, and `streak_count`.
- **Frontend action taken:** The frontend consumes this endpoint and removed unsupported accuracy/rank-change UI.
- **When to file enhancement:** Only if the product requires richer leaderboard fields such as immutable user id, display name, avatar metadata, accuracy, or rank movement. In that case, open a backend enhancement with a specific product requirement.

### Richer Admin Analytics Metrics

- **Status:** Frontend/product enhancement note, not a backend defect
- **Current backend contracts:** Analytics routes expose review counts, active users, mastery averages, estimated retention, topic learner counts, daily active learners/questions answered, and tier attempts/accuracy.
- **Frontend action taken:** The frontend consumes the live analytics routes and removed unsupported fake session duration, topic attempts, learner-level accuracy, and learner answered-count UI.
- **When to file enhancement:** Only if the product requires those exact metrics. Then backend should expose fields with documented formulas.

### Analytics Report Exports

- **Status:** Optional admin reporting enhancement, not a backend defect
- **Current frontend action:** Removed no-op CSV/PDF export buttons so the UI does not imply a missing backend feature.
- **Potential product value:** Admins may eventually need downloadable milestone reports for reviews, active learners, retention, topic health, and difficulty breakdowns.
- **Suggested contract if needed:** Add explicit export endpoints such as `GET /api/v1/analytics/reports/summary.csv` or async report jobs with filters, date ranges, and a documented file format.

### Practice Session Completion Summary

- **Status:** Useful learner-experience enhancement for a later milestone, not a backend defect or current milestone blocker
- **Current backend contract:** The frontend completes a session with `PATCH /api/v1/practice/sessions/<id>/` and separately invalidates profile/mastery/leaderboard caches.
- **Potential product value:** A server-calculated completion summary would let the frontend show authoritative XP, correct count, mastery deltas, next due reviews, and streak changes without stitching data from multiple refetches.
- **Suggested contract if needed:** Return or expose a `session_summary` payload after completion with documented fields and idempotent repeat behavior.

### Broader Audit-Log Coverage

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

- **Status:** Schema documentation issue, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Description:** `manage.py spectacular --format openapi-json` completes but reports documentation errors/warnings: `PasswordResetRequestView` has no request/response serializer annotation, `PracticeSessionViewSet` path parameter type cannot be derived cleanly, and analytics topic operationIds collide between `/analytics/topics/` and `/analytics/topics/{topic_id}/`.
- **Impact:** Frontend contract audits can still inspect runtime behavior, but generated OpenAPI remains noisy and partially misleading.
- **Recommendation:** Add `@extend_schema` request/response annotations for password-reset request, annotate practice session path parameters, and give analytics routes unique operation IDs/serializer shapes.

---

## Open Backend Roadmap Issues From GitHub

### SimpleJWT SSO / Social OAuth Endpoints

- **Status:** Future architecture suggestion
- **Description:** The platform currently relies on local email/username credentials. Google/Microsoft SSO remains a future onboarding improvement.
- **Recommendation:** Add social auth only when the product decision is firm, then expose documented auth endpoints and frontend button behavior.

### Book Ingestion From Admin Interface

- **Status:** Open GitHub #73, backend enhancement
- **Affected future flow:** Admin curriculum/content ingestion
- **Frontend impact:** There is no frontend service or admin page consuming a book-ingestion API yet.
- **Recommendation:** Backend should define ingestion upload/import contracts first: accepted file types, async job shape, validation errors, generated topic/subtopic/question review workflow, and audit-log events. Frontend implementation should wait for that contract.

### Accounts Django App Health Check

- **Status:** Open GitHub #72, backend/API health work
- **Affected current flows:** Login, registration, password reset, current user, preferences, logout, and admin auth gating
- **Frontend impact:** Core account endpoints are consumed directly. Any cleanup should preserve `/api/v1/auth/login/`, `/auth/register/`, `/auth/users/me/`, `/auth/users/me/preferences/`, `/auth/logout/`, and password-reset contracts.
- **Recommendation:** Use this issue to add endpoint-level tests and schema verification for the accounts app, especially the preferences schema mismatch noted above.

### Refactor Topics App

- **Status:** Open GitHub #71, backend/API refactor work
- **Affected current flows:** Topics browsing, subtopic selection, mastery/progress, leaderboard, admin topic CRUD, and question topic linking
- **Frontend impact:** The frontend consumes `/api/v1/topics/`, `/subtopics/`, `/mastery/`, and `/leaderboard/` directly. Route or serializer changes will have broad frontend impact.
- **Recommendation:** Keep existing paths stable or provide a versioned migration plan. Preserve UUID ids, `question_count`, `topic_name`, mastery fields, and leaderboard query support (`?topic=<uuid>`).

---

## Resolved Or Newly Merged Backend Work

### 1. Admin Audit Logs API

### 1. Missing `selected_answer_index` migration

- **Status:** ✅ Resolved, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Verification:** `backend/practice/migrations/0003_questionresponse_selected_answer_index.py` is now committed. `manage.py makemigrations --check --dry-run` returns `No changes detected`. Local `manage.py migrate --check` may still fail until the newly committed migrations are applied to the local database.

### 2. Bulk practice session submission double-award risk

- **Status:** ✅ Resolved, verified by serializer audit 2026-06-16 after merging `origin/master` at `d841620`
- **Verification:** `PracticeSessionCreateSerializer.create()` now stores `session.total_xp_earned` only and no longer increments `learner.current_xp`, streak, or `last_practice_date`. Learner aggregate XP/streak awarding remains centralized in `PracticeSessionSerializer.update()` when `end_time` completes the session.

### 3. Backend email environment import failure

- **Status:** ✅ Resolved, verified 2026-06-16 after merging `origin/master` at `d841620`
- **Verification:** `settings.py` now uses `EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))`, `EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS') == 'True'`, and `backend/.env.example` documents the email variables. `manage.py check` passes without supplying `EMAIL_PORT` in the shell.

### 4. Password reset request response no longer exposes reset credentials

- **Status:** ✅ Resolved, verified 2026-06-15 after backend merge `a7ad281`
- **Verification:** APIClient smoke with an existing account and a missing email returned `200` with the same response keys: `['message']`. No `uid` or `token` keys were returned in JSON. The frontend request flow at `/forgot-password` ignores response credentials, and the reset confirmation route `/reset-password?uid=...&token=...` now posts the emailed credentials to `/auth/password-reset/confirm/`.

### 5. Adaptive session generation serializer field omission

- **Status:** ✅ Resolved, verified 2026-06-15 after backend merge `a7ad281`
- **Verification:** `QuestionSerializer.Meta.fields` now includes `subtopic_name`. Authenticated APIClient smoke for `GET /api/v1/practice/sessions/generate-adaptive/` returned `200` with `questions` and `message`.

### 6. Current User Serializer Date Field

### 2. User Preferences Persistence API

### 7. Adaptive Session Generation UUID/Subtopic Query Bug

### 3. Admin System Health Telemetry API

### 8. Practice Session Creation Returns `id`

### 4. Server-Side Token Revocation On Logout

### 9. Practice Session Completion XP Awarding Bug (Critical Bug)

### 5. Leaderboard Contract Moved

### 10. Interactive Practice Response Submission Endpoint

### 6. Admin Question Reads Include `correct_answer_index`

### 11. Bulk & Time-Series Analytics Telemetry

### 7. OpenAPI Warning Cleanup

### 12. Curriculum Questions Counts

### 8. Analytics Caching

### 13. Topic Typo Resolution (`/topics/`)

### 9. User Preferences PATCH Schema Alignment

### 14. User Initials and Avatar Colors in Token Response

### 10. Post-Submit Answer Reveal

- **Status:** Resolved for answer reveal / monitor rating persistence separately under issue 1
- **Contract:** `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/`
- **Source check:** `QuestionResponseFeedbackSerializer` returns `correct_answer_index` only after answer submission.
- **Frontend consumption:** The learner practice UI uses this field to mark the correct option after submit without exposing answers in pre-submit question reads.

### 11. Topics Operation IDs And Permission Coverage

- **Status:** Merged upstream in `origin/interface` at `04d3fe2`
- **Contracts:** `GET/POST/PATCH/DELETE /api/v1/topics/`, `/api/v1/subtopics/`, and read-only `/api/v1/mastery/`
- **Source check:** Topic and subtopic viewsets now have explicit OpenAPI operation IDs, mastery remains read-only, and `backend/topics/tests.py` covers learner/staff permission boundaries.
- **Frontend consumption:** Current topic browsing, admin topic CRUD, and mastery reads remain on the same paths; no frontend route changes required.
