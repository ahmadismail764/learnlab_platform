# Pre-Translation Frontend Audit

Date: 2026-06-21  
Branch: `interface` at `a7d01ec` after `git pull origin interface`  
Schema source: live `http://127.0.0.1:8000/schema/`

## Contract Findings

- Frontend service calls match the live OpenAPI path inventory for auth, preferences, topics, subtopics, mastery, practice questions, unified practice sessions, analytics, leaderboard, and admin audit/system-health routes.
- Current practice flow uses `POST /api/v1/practice/sessions/` with `responses: []`, optional `?topic=<uuid>`, and answer submission through `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/`.
- Learner question reads still omit `correct_answer_index`; the UI only stores/reveals it after the post-submit feedback response includes `correct_answer_index`.
- Practice completion still waits for `PATCH /api/v1/practice/sessions/<id>/` to succeed before showing the completed screen.
- Stale endpoint scan found no frontend code consuming removed `/practice/topics/`, `/practice/mastery/`, `/auth/learner/me/`, old response routes, or explanation-video fields. References remain only in audit docs describing prior cleanup/backend drift.

## Frontend-Owned Fixes Made

- Added an auth-cleared event in `src/services/api.ts` so failed token refresh clears auth storage and immediately notifies the app shell.
- Wired `AuthContext` to that event so expired auth redirects out of protected learner/admin UI without waiting for a reload.
- Reused the same clearing path for explicit logout.
- Replaced direct app-level `console.error`/`console.warn` calls in auth, practice, and localStorage paths with the existing dev-gated logger.

## Backend-Owned Issues Still Visible

- The live schema still documents the per-response practice route session `id` parameter as a plain string, while other session routes mark it as UUID. Keep this with the existing backend schema-warning issue.
- Backend practice tests/schema verification remain backend-owned as documented in `backend_issues.md`: stale `QuestionResponseViewSet` import and the remaining `PracticeSessionViewSet` schema warning.
- No frontend fallback was added for those backend issues.

## Translation Pass Shortlist

Detailed Arabic UX findings are now tracked in `frontend/arabic_translation_ux_audit_2026-06-21.md`.

1. Replace verbose or grammatically weak practice feedback. Example: `practice:incorrectAnswerFeedback` currently says `ليست صحيحة. سُجل الخيار المحدد كإجابة خاطئة.` Prefer a concise UX form such as `إجابة خاطئة` or a full sentence with correct agreement if context requires it.
2. Decide how to present FSRS. Current Arabic copy often leaves `FSRS` in user-facing labels. A smoother product phrase could be `جدولة المراجعة الذكية` or `جدولة المراجعة المتكيفة`, while preserving the acronym only where technically useful.
3. Audit Arabic FSRS/progress terms for conceptual accuracy: `speed`, `retention`, `memory`, `mastery`, `stability`, `retrievability`, and `interval` are mixed across learner/admin copy and need one glossary.
4. Remove remaining hardcoded English user-facing copy before the broad rewrite: `useApiErrorInterceptor.ts`, default `ErrorBoundary.tsx`, `AnalyticsPage.tsx` eyebrow, weekday labels, and chart tooltip text.
5. Tighten Arabic UI length in small containers: practice grade labels/hints, dashboard status labels, leaderboard empty states, and admin stat cards.
6. Review Arabic grammar after shortening, especially agreement after numbers, tanween where appropriate, and avoiding awkward literal constructions such as `عقد التحليلات`.

## Verification

- `bun run i18n:check` passed.
- `bun run i18n:prune:check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `bun run test:run` passed: 15 files, 88 tests.
