# Removed Static Data — Integration Changelog

> **Date**: 2026-05-20  
> **Context**: Frontend–backend integration after backend commit `3440c23` fixed all issues documented in `backend_issues.md`.

This document comprehensively lists all static/mock data that was removed from the frontend codebase and what replaced it.

---

## 1. Static Data Files Deleted

### `src/data/sampleQuestions.ts` (454 lines)

**What it contained:**
- 12 multiple-choice `SampleQuestion` objects across 6 Discrete Mathematics categories:
  - Logic (2 questions)
  - Set Theory (2 questions)
  - Relations (2 questions)
  - Combinatorics (2 questions)
  - Graph Theory (2 questions)
  - Number Theory (2 questions)
- 6 essay-type questions (1 per category)
- Helper functions: `getQuestionsByTier()`, `getRandomQuestions()`, `getMixedQuestions()`
- Exported collections: `sampleQuestions`, `essayQuestionsPool`, `allQuestions`, `questionsByCategory`

**Why removed:** Questions are now served by the backend via `GET /practice/questions/`. The seed script (`frontend/scripts/seed-backend.py`) populates 24 questions across 6 topics and 12 subtopics.

**What replaced it:** `questionsService.getQuestions()` in `src/services/questions.ts` fetches from the API.

### `src/data/index.ts` (6 lines)

**What it contained:** Re-export barrel file for `sampleQuestions.ts`.

**Why removed:** No components imported from `@/data`. The barrel was unused.

---

## 2. Service Stubs Replaced with Real API Calls

### `src/services/questions.ts`

| Before | After |
|--------|-------|
| `supportsWrites: false` | `supportsWrites: true` |
| `createQuestion()` threw `"not available on this backend"` | `POST /practice/questions/` |
| `updateQuestion()` threw `"not available on this backend"` | `PUT /practice/questions/<id>/` |
| `deleteQuestion()` threw `"not available on this backend"` | `DELETE /practice/questions/<id>/` |
| `getQuestion()` fetched full list then filtered | `GET /practice/questions/<id>/` |

### `src/services/auth.ts`

| Before | After |
|--------|-------|
| `updateCurrentUser()` threw `"not available on this backend"` | `PATCH /auth/users/me/` |
| `getCurrentUser()` primary path failed, used JWT fallback | `GET /auth/users/me/` works as primary |
| `login()` decoded JWT for user info (only had `user_id`) | Extracts `data.user` from login response |

### `src/services/learners.ts`

| Before | After |
|--------|-------|
| `getLeaderboard()` returned `[]` | `GET /practice/learners/leaderboard/` |
| `getTopicLeaderboard()` returned `[]` | `GET /practice/learners/leaderboard/?topic=<id>` |
| `getCurrentProfile()` used auth fallback only | Tries `GET /practice/learners/` first, then auth fallback |

### `src/services/analytics.ts`

| Before | After |
|--------|-------|
| `getAggregatedMetrics()` returned `null` with `console.warn` | `GET /analytics/aggregated/` |
| `getTopicAnalytics()` returned `null` with `console.warn` | `GET /analytics/topics/<id>/` |

### `src/services/topics.ts`

| Before | After |
|--------|-------|
| `getTopicMastery()` returned `[]` (hardcoded empty) | `GET /topcis/mastery/` |

### `src/services/admins.ts`

| Before | After |
|--------|-------|
| `getCurrentProfile()` threw `"not available on this backend"` | Uses `authService.getCurrentUser()` |

### `src/services/practice.ts`

| Before | After |
|--------|-------|
| `createSession()` tried 3 different payload shapes | Single `{ responses: [...] }` payload per integration guide |
| `submitInteraction()` tried 2 paths × 3 payloads (6 combos) | Single `POST /practice/responses/` with known schema |
| Local session fallbacks throughout | Removed for endpoints that now work; kept only for `generate-adaptive` |

---

## 3. Hardcoded Values Cleaned Up

### `src/pages/admin/AdminProfilePage.tsx`

| Before | After |
|--------|-------|
| `systemStats` initialized with `{ totalLearners: 245, totalQuestions: 1280, activeToday: 42, systemUptime: '99.9%' }` | Initialized with `{ totalLearners: 0, totalQuestions: 0, activeToday: 0, systemUptime: '--' }` |

> **Note:** The `recentActions` array remains mock data (labeled "Simulated") — no backend endpoint exists for admin action history.

### `src/pages/auth/LoginPage.tsx`

| Before | After |
|--------|-------|
| Learner test account: `testlearner` / `testpass123` | `learner` / `learner123` |

---

## 4. Stale Comments Removed

- `auth.ts`: Removed references to `backend_issues.md #2`, `#4`, `#10`
- `auth.ts`: Removed `"NOTE: The backend JWT currently only contains { user_id }"` comments
- `auth.ts`: Removed `eslint-disable-next-line @typescript-eslint/no-unused-vars` on `updateCurrentUser`
- `questions.ts`: Removed "not available on this backend" error messages from CRUD stubs

---

## 5. Items Intentionally Kept

| Item | Reason |
|------|--------|
| `/topcis/` URL prefix in `topics.ts` | Backend still uses this URL (confirmed in integration guide). Will be updated when backend fixes the typo. |
| `AdminDashboard.tsx` system health hardcoded values (`'99.9%'`, `'67%'`) | System health monitoring is out of backend scope |
| `AdminProfilePage.tsx` "Simulated" recent actions | No backend endpoint for admin action history |
| `practice.ts` local fallback for `generate-adaptive` | This endpoint may not exist on the backend |
| `ForgotPasswordPage.tsx` | Already wired to real `POST /auth/password-reset/` endpoint |
