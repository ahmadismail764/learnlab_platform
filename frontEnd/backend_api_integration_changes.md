# Backend API Integration Changes

This file tracks frontend changes made to align with `api_endpoints_guide.md`.

## Step 1: Authentication Endpoints (`/api/v1/auth/*`)
Status: Integrated

Matched endpoints:
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`
- `GET /api/v1/users/me/`

Frontend changes:
- Updated `src/contexts/AuthContext.tsx`
  - `login(credentials)` now calls backend login, then `users/me`.
  - `register(userData)` now calls backend register, then auto-logins.
  - Hydration now checks stored JWT token and fetches current user from backend.
  - Removed local/mock-only auth behavior and resolved merge-conflict artifacts.
- Updated `src/pages/auth/LoginPage.tsx`
  - Removed mock user login flow.
  - `handleSubmit` now uses `login({ email, password })`.
  - API error messages are shown in UI.
- Updated `src/pages/auth/RegisterPage.tsx`
  - Removed mock account creation flow.
  - `handleSubmit` now calls backend register contract:
    - `email`
    - `username`
    - `password`
    - `first_name`
    - `last_name`
- Updated `src/services/auth.ts`
  - Added backend error parsing (`detail`, `non_field_errors`, field-wise errors).
  - Added stronger type signatures for login/register payloads.

## Step 2: Topics & Questions (`/api/v1/topics/`, `/api/v1/questions/`)
Status: Already integrated before this pass

Matched endpoints:
- `GET /api/v1/topics/` (+ RESTful detail/create/update/delete)
- `GET /api/v1/questions/` (+ RESTful detail/create/update/delete)

Frontend files already matching guide:
- `src/services/topics.ts`
- `src/services/questions.ts`

## Step 3: Practice Sessions & Mastery (`/api/v1/sessions/`, `/api/v1/mastery/`)
Status: Integrated in this pass

Matched endpoints:
- `GET /api/v1/sessions/`
- `POST /api/v1/sessions/`
- `GET /api/v1/sessions/{id}/`
- `PATCH /api/v1/sessions/{id}/`
- `GET /api/v1/mastery/`

Frontend changes:
- Updated `src/services/practice.ts`
  - Replaced outdated `/practice-sheets/` and `/submissions/` usage with `/sessions/`.
  - Added canonical methods:
    - `getSessions()`
    - `getSession(id)`
    - `createSession(data)`
    - `updateSession(id, data)`
  - Kept backward-compatible aliases:
    - `generateSheet()` -> `createSession({})`
    - `submitSheet(sessionId, data)` -> `updateSession(sessionId, data)`
    - `getSubmissionHistory()` -> `getSessions()`
- `src/services/students.ts`
  - `getMastery()` already points to `/mastery/` (kept as-is).

## Step 4: Analytics (`/analytics/*`)
Status: Integrated in this pass

Matched endpoints:
- `GET /analytics/aggregated/`
- `GET /analytics/topic/<topic_id>/`

Frontend changes:
- Added `src/services/analytics.ts`
  - `getAggregatedMetrics()` -> `/analytics/aggregated/`
  - `getTopicAnalytics(topicId)` -> `/analytics/topic/${topicId}/`
- Updated `src/services/index.ts`
  - Exported analytics service.

## Step 5: UI Integration Status Indicator (Static vs Backend)
Status: Integrated in this pass

Goal:
- Show a clear, route-aware frontend indicator so teammates can immediately see whether a screen is still static, partially integrated, or backend-integrated.

Frontend changes:
- Added `src/constants/integrationStatus.ts`
  - Introduced route-to-status mapping with 3 states:
    - `Backend Integrated`
    - `Partially Integrated`
    - `Static Demo Data`
- Added `src/components/common/IntegrationStatusBadge.tsx`
  - Reusable badge component driven by current route (`useLocation`).
  - Includes tooltip/detail via `title`.
- Updated `src/components/common/index.ts`
  - Exported `IntegrationStatusBadge`.
- Updated `src/components/layout/Header.tsx`
  - Added compact status badge in dashboard header.
- Updated `src/components/layout/AuthLayout.tsx`
  - Added compact status badge above login/register forms.

## Step 6: Temporary Frontend-Only Admin Access (Testing)
Status: Integrated in this pass

Goal:
- Allow QA/testing to access admin UI without requiring backend admin account creation during early integration.

Frontend changes:
- Added `src/utils/adminOverride.ts`
  - Stores a list of email-based admin overrides in localStorage.
  - Exposes add/remove/check helpers.
- Updated `src/contexts/AuthContext.tsx`
  - Role resolution now treats user as admin when either:
    - backend `is_staff` is true, OR
    - the user email is present in admin override list.
- Updated `src/pages/auth/LoginPage.tsx`
  - Added checkbox: "Enable temporary admin access for this email (frontend testing mode)".
- Updated `src/pages/auth/RegisterPage.tsx`
  - Added checkbox: "Grant temporary admin access for this account (frontend testing mode)".

Important:
- This is intentionally temporary and should be removed once backend-managed admin provisioning is finalized.

## Validation Notes
- All changed service/auth files compile without TypeScript/ESLint errors via workspace diagnostics.
- Endpoint paths include trailing slashes to match Django router behavior.

## Remaining Work (Future Steps)
- Replace any page-level mock data in dashboards/analytics views with `analyticsService`, `practiceService`, and existing services where applicable.
- Add centralized response typing for backend DTOs to reduce `any` in service methods.
- Add integration tests for auth/session flows against a running backend.
