# LearnLab Backend-Owned Issues & Integration Notes (Frontend Audit)

> **For the backend team.** This document separates true backend-owned problems from frontend/product integration notes. If the backend already provides a working contract and the frontend was not consuming it, that is **not** listed as a backend issue.
>
> **Latest update:** 2026-06-21 after pulling `origin/interface` at `04d3fe2`, checking migrations, and re-running backend schema/test smoke checks.

---

## Backend-Owned Issues / Contract Risks

### 1. Post-Submit Practice Feedback And Difficulty Rating Contract

- **Status:** Partially resolved upstream / still has one contract gap, tracked in GitHub #89
- **Affected flow:** Learner practice sessions
- **Current behavior:** Learner question reads still omit `correct_answer_index` before answering. `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/` now returns post-submit feedback including `selected_answer_index`, `is_correct`, `correct_answer_index`, and `confidence_rating`.
- **Frontend consumption:** The frontend now submits to the per-question placeholder route and uses the post-submit `correct_answer_index` to reveal the correct choice only after the learner commits an answer.
- **Remaining gap:** `QuestionResponseRatingSerializer` exists, but there is no documented route for the later learner difficulty rating / FSRS grade. The current UI collects the rating locally to advance the session, but cannot persist that rating separately.
- **Recommendation:** Keep pre-submit learner reads answer-safe, preserve the post-submit reveal payload, and add/document the rating persistence contract when FSRS grading becomes part of this milestone.

### 2. Unified Practice Session Create Needs A Tighter Runtime Contract

- **Status:** Partially resolved upstream / monitor before closing the corresponding backend issue
- **Affected contract:** `POST /api/v1/practice/sessions/` with non-empty nested `responses`
- **Current source check:** `PracticeSessionCreateSerializer.responses` now uses `QuestionResponseCreateSerializer`, so the old OpenAPI shape mismatch is fixed. `PracticeSessionViewSet.create()` also generates adaptive/fallback placeholder responses for the session.
- **Remaining risk:** Non-empty `responses` on session creation are still ambiguous because serializer-created responses can be combined with generated placeholders. The frontend therefore creates sessions with `responses: []` and answers through `/practice/sessions/<session_id>/responses/<question_id>/`.
- **Frontend consumption:** `generateAdaptiveSession()` now uses the unified `POST /practice/sessions/?topic=<id>` contract, then fetches each returned question id because the session response includes placeholder ids but not learner-safe question text/choices.
- **Recommendation:** Document that session creation should receive an empty `responses` array, or remove nested response creation from this endpoint. Consider returning nested learner-safe question summaries in the create response to avoid per-question follow-up fetches.

### 3. Full FSRS-5 Scheduling Algorithm

- **Status:** Active backend algorithm improvement; track in the existing FSRS issue if one is open, otherwise open a dedicated backend issue
- **Current source check:** `backend/practice/fsrs_engine.py` still uses a simple stability multiplier stub.
- **Recommendation:** Implement full FSRS-5 formulas using elapsed days, difficulty, stability, retrievability, and the accepted rating/confidence field.

### 4. Cryptographic Signing Key Length Warning

- **Status:** Environment/security warning
- **Description:** Local backend boots can emit a SimpleJWT insecure key length warning if `SECRET_KEY` is under 32 bytes.
- **Recommendation:** Use high-entropy production secrets for `SECRET_KEY` and any JWT signing key configuration.

### 5. Practice Test And Schema Verification Drift

- **Status:** Active backend maintenance blocker
- **Current verification:** `python manage.py test practice` fails during import because `backend/practice/tests.py` still imports the removed/commented `QuestionResponseViewSet`.
- **Current schema check:** `python manage.py spectacular --file NUL --validate --fail-on-warn` still fails with one warning for `PracticeSessionViewSet`: drf-spectacular cannot derive the `id` path parameter type.
- **Frontend impact:** The frontend can consume the live routes directly, but backend CI/schema confidence is still weaker than it should be while tests and generated schema warnings lag behind the new unified practice route.
- **Recommendation:** Update the practice tests around `POST /api/v1/practice/sessions/` and `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/`, remove stale `QuestionResponseViewSet` imports, and fix the remaining session `id` path-parameter schema annotation.

## Docker / Infrastructure Readiness Notes

### Analytics Requires Redis Cache Availability

- **Status:** Environment note for the Docker milestone, not a critical backend API defect if the supported test path is the full Docker stack.
- **Affected contracts when Redis is absent:** `GET /api/v1/analytics/aggregated/`, `GET /api/v1/analytics/topics/`, and `GET /api/v1/analytics/activity/`
- **Current source check:** These views are wrapped with `cache_page`, while `settings.CACHES.default` uses `django.core.cache.backends.redis.RedisCache`.
- **Reproduction check outside Docker:** Running Django cache access locally failed with `redis.exceptions.ConnectionError: Error 10061 connecting to 127.0.0.1:6379`, which explains the admin analytics 500s when Redis is not running.
- **Classification:** If the team expects frontend, backend, database, and Redis to run through Docker Compose, this should be tracked as Docker/infrastructure readiness: make sure Redis is included, backend depends on it, health checks are present, and local docs tell developers not to run cached analytics without Redis.
- **Optional resilience enhancement:** Backend can still choose to add a development `LocMemCache` fallback or tolerate Redis outages for read-only analytics, but that is a robustness improvement rather than a frontend/backend contract blocker.

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

- **Status:** Optional admin observability enhancement, not a backend defect
- **Current backend contract:** `GET /api/v1/admin/audit-logs/` is available and consumed by the admin profile activity section.
- **Potential product value:** Audit logs become more useful if they consistently record content CRUD, auth/security events, role changes, imports, settings changes, and failed admin operations.
- **Suggested contract if needed:** Standardize `action_type`, `target_resource`, actor metadata, and event-specific metadata keys.

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

- **Status:** Merged in `origin/master` at `aaa46b7`
- **Contract:** `GET /api/v1/admin/audit-logs/`
- **Source check:** `accounts.admin_urls` mounts `audit-logs/`, `AuditLog` exists in `accounts.models`, and `AuditLogSerializer` exposes actor/action/resource/timestamp metadata.
- **Frontend consumption:** Consumed by the admin profile activity section.

### 2. User Preferences Persistence API

- **Status:** Merged in `origin/master` at `aaa46b7`
- **Contract:** `GET/PATCH /api/v1/auth/users/me/preferences/`
- **Source check:** `UserPreferencesView` and `UserPreferencesSerializer` persist JSON preferences on the user model.
- **Frontend consumption:** Consumed by admin settings persistence.

### 3. Admin System Health Telemetry API

- **Status:** Merged in `origin/master` at `aaa46b7`
- **Contract:** `GET /api/v1/admin/system-health/`
- **Source check:** `SystemHealthView` returns CPU, memory, disk, database, uptime, and average API latency fields.
- **Frontend consumption:** Consumed by the admin dashboard system snapshot.

### 4. Server-Side Token Revocation On Logout

- **Status:** Resolved / monitor
- **Contract:** `POST /api/v1/auth/logout/`
- **Source check:** `LogoutView` blacklists the submitted refresh token with SimpleJWT.
- **Frontend consumption:** Logout calls the backend route before clearing local tokens.

### 5. Leaderboard Contract Moved

- **Status:** Merged upstream
- **Contract:** `GET /api/v1/leaderboard/`
- **Source check:** Leaderboard now lives in `topics.views` and is mounted through `topics.urls`, not `practice.urls`.
- **Frontend consumption:** Learner/admin leaderboard consumers use `/leaderboard/`.

### 6. Admin Question Reads Include `correct_answer_index`

- **Status:** Resolved
- **Source check:** `QuestionViewSet.get_serializer_class()` returns `QuestionAdminSerializer` for staff reads and `QuestionSerializer` for learner reads.
- **Frontend note:** This preserves learner answer safety and supports admin preview/edit.

### 7. OpenAPI Warning Cleanup

- **Status:** Partially fixed upstream / still needs follow-up
- **Source check:** `PracticeSessionViewSet` annotates several UUID path parameters, but current schema validation still emits one `PracticeSessionViewSet` `id` path-parameter warning.
- **Follow-up:** Keep this open until `manage.py spectacular --file NUL --validate --fail-on-warn` exits cleanly.

### 8. Analytics Caching

- **Status:** Implemented upstream / monitor
- **Description:** Redis-backed caching was added for analytics routes. Keep local and deployment environments aligned with backend dependency/configuration requirements.

### 9. User Preferences PATCH Schema Alignment

- **Status:** Resolved upstream in `origin/interface` at `59db2e7`
- **Contract:** `GET/PATCH /api/v1/auth/users/me/preferences/`
- **Source check:** `UserPreferencesView.patch()` now accepts the documented `{ "preferences": { ... } }` envelope while preserving compatibility with the previous flat payload shape.
- **Frontend consumption:** The frontend now sends the documented preferences envelope.

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
