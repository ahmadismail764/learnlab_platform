# Frontend Temporary Fallbacks (Backend Compatibility)

This document tracks temporary frontend compatibility fallbacks. As of the 2026-05-28 cleanup, no listed fallback remains active in the frontend code.

## Removed on 2026-05-28

### Auth / Identity

- **Current user hydration fallback:** Removed cached-user/JWT-decoding fallback from `authService.getCurrentUser()`. The frontend now relies on `GET /api/v1/auth/users/me/` and surfaces backend failures directly.
- **Learner profile fallback chain:** Removed `/practice/learners/` list matching and snapshot-derived profile fallback. Learner profile data now comes from `/auth/users/me/`.

### Practice / Sessions

- **Adaptive session generation fallback:** Removed generic `/practice/questions/` fallback when adaptive generation fails. Starting practice now requires `GET /practice/sessions/generate-adaptive/` to return the documented adaptive payload.
- **Session history fallback:** Removed the empty-array fallback for missing session history. `GET /practice/sessions/` failures now surface as errors.
- **Practice response payload compatibility:** Removed the minimal-only live response payload. The frontend now sends `question`, `is_correct`, `time_taken_seconds`, `confidence_rating`, and `answer_text` to the nested response endpoint.

### Auth API Compatibility

- **Password reset endpoint scanning:** Removed scanning across legacy reset route variants. The frontend now uses the canonical routes:
  - `POST /api/v1/auth/password-reset/`
  - `POST /api/v1/auth/password-reset/confirm/`

### API Base URL Recovery

- **API root retry:** Removed origin-root retry when `VITE_API_BASE_URL` is misconfigured. The configured API base URL must point to the deployed API path.

## Current Backend Issue Tracking

The frontend fallbacks above remain removed. Active backend issues, if any, are tracked in `frontend/backend_issues.md` or GitHub issues; do not reintroduce frontend compatibility fallbacks unless they are explicitly approved and documented with a removal condition.
