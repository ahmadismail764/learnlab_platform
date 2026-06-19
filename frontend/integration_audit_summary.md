# Frontend / Backend Integration Audit Summary

Date: 2026-06-19  
Branch context: `interface` with backend merge `7153e96` present

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

## Backend-Owned Items To File If Not Already Tracked

```bash
gh issue create \
  --repo ahmadismail764/learnlab_platform \
  --title "Align PracticeSessionCreateSerializer nested responses contract" \
  --label backend \
  --label api \
  --body "PracticeSessionCreateSerializer.responses currently uses QuestionCreateAndUpdateSerializer, but create() reads each nested row as a QuestionResponse payload with question and selected_answer_index. This publishes a question-authoring shape for an answer-submission flow. Align the serializer with QuestionResponseCreateSerializer or remove nested response creation from the public create contract. The frontend currently avoids the mismatch by creating sessions with responses: [] and posting answers to /api/v1/practice/sessions/<id>/responses/."
```

```bash
gh issue create \
  --repo ahmadismail764/learnlab_platform \
  --title "Align user preferences PATCH schema with runtime behavior" \
  --label backend \
  --label api \
  --body "PATCH /api/v1/auth/users/me/preferences/ has an OpenAPI request shape documented as { preferences: { ... } }, but UserPreferencesView.patch() merges request.data directly into user.preferences. Either accept the documented wrapper explicitly or update the schema to document flat preference patching. The frontend currently sends the flat object because that is what the runtime accepts."
```

Optional, only if not already tracked:

```bash
gh issue create \
  --repo ahmadismail764/learnlab_platform \
  --title "Implement full FSRS-5 scheduling instead of the current stub" \
  --label backend \
  --label api \
  --body "backend/practice/fsrs_engine.py still uses a simple stability multiplier stub. Implement full FSRS-5 scheduling with elapsed days, difficulty, stability, retrievability, and the accepted rating/confidence field. Coordinate with issue #89 so post-submit difficulty ratings persist into scheduling."
```

Docker/infrastructure note from the admin 500 report:

```bash
gh issue create \
  --repo ahmadismail764/learnlab_platform \
  --title "Ensure Docker stack runs Redis for cached analytics endpoints" \
  --label backend \
  --label api \
  --body "Analytics routes /api/v1/analytics/aggregated/, /analytics/topics/, and /analytics/activity/ are wrapped with cache_page while settings.CACHES.default uses RedisCache. If the supported local/test path is Docker Compose, include Redis in the stack, wire REDIS_URL, add backend depends_on/health checks where appropriate, and document that cached analytics require Redis. Outside Docker, missing Redis currently raises redis.exceptions.ConnectionError: Error 10061 connecting to 127.0.0.1:6379."
```

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
