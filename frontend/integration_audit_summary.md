# Frontend / Backend Integration Audit Summary

Date: 2026-06-19  
Branch context: `interface` with backend merge `7153e96` present

Current status note (2026-06-24): latest `origin/master` is merged into local
`interface`; the old practice import/schema drift and preferences-envelope
items below are resolved. See `frontend/backend_issues.md` for the current
backend-facing issue list.

## What Changed

- Updated frontend consumers to the merged backend contracts for leaderboard, logout, preferences, admin audit logs, and admin system health.
- Wired admin settings to persisted user preferences.
- Wired admin profile activity to backend audit logs.
- Wired admin dashboard system snapshot to backend health telemetry.
- Removed unsupported leaderboard UI for accuracy and rank movement.
- Removed unsupported admin analytics mock metrics and no-op export buttons.
- Removed stale explanation-video question fields from admin question forms, previews, services, validation, learner practice UI, and translations.
- Changed practice completion so the UI only shows a completed session after the backend completion request succeeds.
- Improved admin analytics failure handling so a failing analytics endpoint does not blank the whole admin analytics page.
- Improved admin dashboard/profile partial rendering when aggregated analytics fails.
- Parsed backend analytics error responses so Django 500 details are visible instead of generic status-only messages.
- Documented backend-owned contract risks separately from optional product enhancements in `frontend/backend_issues.md`.

## Current Backend-Owned Follow-Ups

- PDF question extraction exists at `POST /api/v1/extract-questions/`, and the admin question bank now has an upload UI for it. The current Docker environment has no `GEMINI_API_KEY`, so real extraction cannot be fully verified from this stack.
- Product taxonomy needs a settled contract: frontend category/topic/question should map to backend `Topic`/`Subtopic`/`Question`; current mastery and practice session filters are still parent-topic oriented.
- Fresh Docker database volumes may need `learnlab_app` to be granted `CREATEDB` in `init-db.sh`; current local volume already has that role attribute.

## Optional Enhancements

- Richer leaderboard display fields if product needs avatars, immutable user IDs, display names, accuracy, or rank movement.
- Analytics report export endpoints if admins need CSV/PDF milestone reports.
- Content support metadata if lessons need explanation videos, hints, references, worked examples, or solution steps.
- Practice completion summary if the learner result screen should show backend-authoritative XP, correct count, mastery deltas, next due reviews, and streak changes.
- Broader audit-log coverage for content CRUD, auth/security events, imports, settings changes, role changes, and failed admin operations.

## Verification

- Backend migrations: `showmigrations --plan` showed all migrations applied.
- Redis cache check: failed locally with `Error 10061 connecting to 127.0.0.1:6379`, confirming the reported analytics 500 cause when Redis is not running outside the expected full stack.
- `npm run lint`: passed.
- `npm run build`: passed.
- `bun run i18n:check`: passed.
- `bun run i18n:prune:check`: passed.
- `npm run test:run`: passed after rerunning unsandboxed because sandboxed Vitest failed with Windows `spawn EPERM`.
- Playwright/E2E: not run in this pass because local frontend/backend servers were intentionally not started.

## Follow-Up Pass: Frontend Containerization Readiness

Date: 2026-06-19

- Confirmed the live backend docs endpoint responds at `http://localhost:8000/docs/`.
- Confirmed the live OpenAPI path inventory includes the frontend-consumed routes for auth, topics, mastery, leaderboard, practice sessions/responses, analytics, audit logs, and system health.
- Added frontend containerization with a Bun build stage and Nginx static runtime.
- Added a frontend service to the existing root Docker Compose file without changing backend, Postgres, or Redis ownership.
- Updated frontend docs to describe the Docker Compose frontend workflow.
- Removed stale frontend constants that duplicated API/runtime configuration and were no longer imported.
- Removed a redundant `components/common/ErrorBoundary.tsx` re-export file and kept the common barrel export pointed at the shared boundary.
- Updated stale frontend-owned API comments that still referenced old `/practice/topics/`, `/auth/learner/me/`, and `/practice/mastery/` paths.
