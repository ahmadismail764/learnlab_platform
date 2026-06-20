# LearnLab Backend-Owned Issues & Integration Notes (Frontend Audit)

> **For the backend team.** This document separates true backend-owned problems from frontend/product integration notes. If the backend already provides a working contract and the frontend was not consuming it, that is **not** listed as a backend issue.
>
> **Latest update:** 2026-06-19 after frontend/backend contract audit on `interface` with backend merge `7153e96` present.

---

## Backend-Owned Issues / Contract Risks

### 1. Post-Submit Practice Feedback and Difficulty Rating Contract

- **Status:** Active backend contract request, tracked in GitHub #89
- **Affected flow:** Learner practice sessions
- **Current behavior:** Learner question payloads correctly omit `correct_answer_index` before answering. `POST /practice/sessions/<id>/responses/` returns `id`, `question`, and `is_correct`, so the frontend can show whether the selected answer was correct but cannot reveal the correct option after an incorrect answer.
- **Missing contract:** A safe post-submit reveal field, such as `correct_answer_index` or `correct_choice`, returned only after the learner commits an answer. The backend also needs a supported way to persist the later difficulty rating, such as `confidence_rating` or an FSRS grade.
- **Recommendation:** Keep pre-submit learner reads answer-safe, return safe answer reveal data from the response-create endpoint, and document the runtime shape in OpenAPI.

### 2. Bulk Practice Session Create Still Publishes The Wrong Nested Response Shape

- **Status:** Active backend contract warning
- **Affected contract:** `POST /api/v1/practice/sessions/` with non-empty nested `responses`
- **Current source check:** `PracticeSessionCreateSerializer.responses` still uses `QuestionCreateAndUpdateSerializer(many=True, required=False)`, while `create()` reads each row as a `QuestionResponse` payload using `question` and `selected_answer_index`.
- **Impact:** The published bulk session-create contract asks clients for question-authoring fields, while runtime code expects answer-submission fields. The current frontend avoids this by creating sessions with `responses: []` and submitting answers through `/practice/sessions/<id>/responses/`.
- **Recommendation:** Change `PracticeSessionCreateSerializer.responses` to `QuestionResponseCreateSerializer(many=True, required=False)` or remove nested response creation from the public contract.

### 3. Full FSRS-5 Scheduling Algorithm

- **Status:** Active backend algorithm improvement; track in the existing FSRS issue if one is open, otherwise open a dedicated backend issue
- **Current source check:** `backend/practice/fsrs_engine.py` still uses a simple stability multiplier stub.
- **Recommendation:** Implement full FSRS-5 formulas using elapsed days, difficulty, stability, retrievability, and the accepted rating/confidence field.

### 4. Cryptographic Signing Key Length Warning

- **Status:** Environment/security warning
- **Description:** Local backend boots can emit a SimpleJWT insecure key length warning if `SECRET_KEY` is under 32 bytes.
- **Recommendation:** Use high-entropy production secrets for `SECRET_KEY` and any JWT signing key configuration.

### 5. User Preferences PATCH Schema Mismatch

- **Status:** Active backend-owned contract warning
- **Affected contract:** `PATCH /api/v1/auth/users/me/preferences/`
- **Current source check:** The OpenAPI annotation describes a payload shaped like `{ "preferences": { ... } }`, but `UserPreferencesView.patch()` currently merges `request.data` directly into `user.preferences`.
- **Why this is backend-owned:** This is a mismatch between the backend's own runtime behavior and backend-published schema, not a request for the backend to follow a frontend preference. The frontend currently sends the flat JSON object the runtime actually accepts.
- **Recommendation:** Align implementation and OpenAPI. Either accept the documented wrapper explicitly or update the schema to document flat preference patching.

---

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

### Content Support Metadata

- **Status:** Optional content enhancement, not a backend defect
- **Current frontend action:** Removed stale explanation-video fields from question forms, previews, services, and learner practice UI because the current backend question contract does not expose or persist them.
- **Potential product value:** If lessons need richer remediation, backend could support optional explanation video URL, solution steps, hints, references, or worked examples.
- **Suggested contract if needed:** Add metadata to admin question CRUD, define which fields are safe before answer submission, and define which fields are revealed only after a submitted response.

### Practice Session Completion Summary

- **Status:** Optional learner-experience enhancement, not a backend defect
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

- **Status:** Reported fixed upstream in the backend merge that included #81
- **Source check:** `PracticeSessionViewSet` now annotates UUID path parameters. Password-reset and analytics schemas should still be verified by running schema generation after the merge.

### 8. Analytics Caching

- **Status:** Implemented upstream / monitor
- **Description:** Redis-backed caching was added for analytics routes. Keep local and deployment environments aligned with backend dependency/configuration requirements.
