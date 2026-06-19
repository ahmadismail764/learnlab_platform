# LearnLab Backend Issues & Suggestions (Frontend Audit)

> **For the backend team.** This document tracks backend contracts that affect the frontend. Backend source remains read-only from the frontend cleanup thread.
>
> **Latest update:** 2026-06-19 after fetching `origin/master` at `aaa46b7` and merging its backend fixes into `interface`.

---

## Active Contract Risks

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

- **Status:** Active backend algorithm improvement, tracked in GitHub #38
- **Current source check:** `backend/practice/fsrs_engine.py` still uses a simple stability multiplier stub.
- **Recommendation:** Implement full FSRS-5 formulas using elapsed days, difficulty, stability, retrievability, and the accepted rating/confidence field.

### 4. Cryptographic Signing Key Length Warning

- **Status:** Environment/security warning
- **Description:** Local backend boots can emit a SimpleJWT insecure key length warning if `SECRET_KEY` is under 32 bytes.
- **Recommendation:** Use high-entropy production secrets for `SECRET_KEY` and any JWT signing key configuration.

---

## Backend Suggestions Still Not In Scope

### SimpleJWT SSO / Social OAuth Endpoints

- **Status:** Future architecture suggestion
- **Description:** The platform currently relies on local email/username credentials. Google/Microsoft SSO remains a future onboarding improvement.
- **Recommendation:** Add social auth only when the product decision is firm, then expose documented auth endpoints and frontend button behavior.

---

## Resolved Or Newly Merged Backend Work

### 1. Admin Audit Logs API

- **Status:** Merged in `origin/master` at `aaa46b7`
- **Contract:** `GET /api/v1/admin/audit-logs/`
- **Source check:** `accounts.admin_urls` mounts `audit-logs/`, `AuditLog` exists in `accounts.models`, and `AuditLogSerializer` exposes actor/action/resource/timestamp metadata.

### 2. User Preferences Persistence API

- **Status:** Merged in `origin/master` at `aaa46b7`
- **Contract:** `GET/PATCH /api/v1/auth/users/me/preferences/`
- **Source check:** `UserPreferencesView` and `UserPreferencesSerializer` persist JSON preferences on the user model.

### 3. Admin System Health Telemetry API

- **Status:** Merged in `origin/master` at `aaa46b7`
- **Contract:** `GET /api/v1/admin/system-health/`
- **Source check:** `SystemHealthView` returns CPU, memory, disk, database, uptime, and average API latency fields.

### 4. Server-Side Token Revocation On Logout

- **Status:** Resolved / monitor
- **Contract:** `POST /api/v1/auth/logout/`
- **Source check:** `LogoutView` blacklists the submitted refresh token with SimpleJWT.
- **Frontend note:** Logout should call the backend route before clearing local tokens.

### 5. Leaderboard Contract Moved

- **Status:** Merged upstream
- **Contract:** `GET /api/v1/leaderboard/`
- **Source check:** Leaderboard now lives in `topics.views` and is mounted through `topics.urls`, not `practice.urls`.
- **Frontend note:** Audit frontend leaderboard services for `/practice/leaderboard/` assumptions after the merge.

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

