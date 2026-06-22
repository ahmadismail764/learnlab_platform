# Post-Milestone 1 Frontend Audit Steps

Once the backend critical contract fixes land, prioritize the next frontend audits in this order.

## 1. Real Backend Acceptance Audit

Run the actual learner and admin flows against the live backend, not mocks:

- Login, registration, logout, and token refresh
- Topic browsing
- Adaptive practice start, answer submission, post-submit feedback, and completion
- Admin topic and question CRUD
- Analytics, settings, and profile pages

## 2. Query And State Correctness Audit

Verify React Query invalidation and UI state after mutations:

- XP and streak updates after practice completion
- Leaderboard refresh
- Mastery and progress refresh
- Admin CRUD updates without stale rows
- Logout clearing user state cleanly
- Role redirects behaving correctly

## 3. Real-Service E2E Smoke Suite

Add tight Playwright coverage for the main happy paths and a few important failure paths. Keep this focused on integration breakage, not exhaustive UI coverage.

## 4. Frontend Container Runtime Audit

Verify the production container path:

- Nginx SPA routing works on deep links
- `VITE_API_BASE_URL` points to the intended backend
- Arabic and RTL assets load correctly
- Production build has no Vite dev artifacts
- Refreshing `/learner/...` or `/admin/...` does not 404

## 5. Accessibility, Mobile, And RTL Audit

Check the highest-risk usability areas:

- Keyboard navigation
- Focus states in modals and forms
- Button labels and icon affordances
- Form errors
- Mobile overflow
- Arabic RTL layout regressions

## 6. Resiliency And Error-State Audit

Confirm failures are explicit without hiding backend contract problems:

- Backend unavailable
- Expired auth
- Forbidden admin access
- Empty topics, questions, or analytics
- Failed practice answer submission
- Failed practice completion request

## 7. Frontend Security And Privacy Audit

Check sensitive frontend behavior:

- No pre-submit answer leakage
- No tokens in logs
- No sensitive backend errors exposed to normal users
- Admin-only UI does not rely on frontend guards as security

## 8. Branch Hygiene And Merge Readiness

Before merging:

- Run `git diff --check`
- Remove stale docs and comments
- Confirm root README and global compose changes are intentional
- Keep frontend-only scope clean unless another owner explicitly accepts cross-scope changes

