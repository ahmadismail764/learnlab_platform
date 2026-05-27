# Frontend Temporary Fallbacks (Backend Compatibility)

This document lists temporary frontend fallback behaviors that exist only to keep the app usable while backend endpoints are unstable, missing, or misconfigured. Remove these once the backend issues are resolved.

## Auth / Identity

### 1. Current user hydration fallback
- **Trigger:** `GET /api/v1/auth/users/me/` fails (network error) or returns non-200 and `allowFallback` is enabled.
- **Fallback behavior:** Use cached user snapshot (from storage) or decode the JWT payload to infer user identity.
- **Impact:** Role and profile details can be stale; XP / streak data may be missing.
- **Removal condition:** `/auth/users/me/` consistently returns `200` with full user profile data.

### 2. Learner profile fallback chain
- **Trigger:** `GET /api/v1/auth/users/me/` fails while loading learner profile.
- **Fallback behavior:**
  1) Try `GET /api/v1/practice/learners/` and match the current user ID.
  2) If that fails, fall back to the cached snapshot / JWT-derived user data.
- **Impact:** XP, streak, and last practice date may display as `0` or stale values.
- **Removal condition:** `/auth/users/me/` consistently returns `200` and includes XP + streak fields.

## Practice / Sessions

### 3. Adaptive session generation fallback
- **Trigger:** `GET /api/v1/practice/sessions/generate-adaptive/` returns 5xx, 404, or 405.
- **Fallback behavior:** Fetch `GET /api/v1/practice/questions/` and return the first 10 questions as a general practice set.
- **Impact:** No personalization or topic filtering; order is arbitrary.
- **Removal condition:** Adaptive endpoint returns `200` with a stable response.

### 4. Session history fallback
- **Trigger:** `GET /api/v1/practice/sessions/` returns 404 or 405.
- **Fallback behavior:** Return an empty array.
- **Impact:** Session history UI appears empty even when sessions exist.
- **Removal condition:** Sessions list endpoint is available and returns `200`.

### 5. Practice response payload compatibility
- **Trigger:** `QuestionResponseCreateSerializer` currently accepts only `question` and `is_correct` for live practice responses.
- **Fallback behavior:** Submit the minimal supported response payload and keep FSRS confidence, time-on-question, and free-form response text out of the request until the backend contract expands.
- **Impact:** The backend receives correctness for scheduling/XP, but richer practice telemetry is temporarily unavailable server-side.
- **Removal condition:** Backend exposes and documents response fields for confidence rating, elapsed time, and learner answer text.

## Auth API Compatibility

### 6. Password reset endpoint scanning
- **Trigger:** Backend does not expose a single, stable password-reset route.
- **Fallback behavior:** Try the following in order until one works:
  - `POST /api/v1/auth/password-reset/`
  - `POST /api/v1/auth/password/reset/`
  - `POST /api/v1/auth/forgot-password/`
  - `POST /api/v1/auth/password-reset/confirm/`
  - `POST /api/v1/auth/password/reset/confirm/`
  - `POST /api/v1/auth/reset-password/confirm/`
- **Impact:** Extra requests on older or partially implemented backends.
- **Removal condition:** A single documented password-reset flow is stable.

## API Base URL Recovery

### 7. API root retry when base URL is misconfigured
- **Trigger:** Requests to the configured base URL return 404, and the base includes `/api/`.
- **Fallback behavior:** Retry the request against the API root (origin-only).
- **Impact:** Hides base URL misconfiguration; can mask environment errors.
- **Removal condition:** `VITE_API_BASE_URL` always matches the deployed API path.
