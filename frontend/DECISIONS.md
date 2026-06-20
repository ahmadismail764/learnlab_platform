# Frontend Decisions

This file records product and frontend architecture decisions that should remain clear during graduation cleanup and future work.

## 2026-06-17: Current Practice Sessions Are Choice-Based Only

Decision:
- Active learner practice sessions support questions with answer choices only.
- Open-ended written math is not part of the current review-session flow.
- If the backend ever returns no-choice questions in an adaptive session, the frontend filters them out before starting the session UI.

Rationale:
- Written answers require more input effort and were judged less user-friendly for regular review sessions.
- The active backend response contract submits `selected_answer_index`, so choice-based questions match the current session contract cleanly.
- Keeping no-choice questions out of the session prevents a dead-end where a learner can enter an answer but cannot submit a valid interaction.

Follow-up:
- If written/user-owned problems return later, build them as a separate optional solver flow, not as default session questions.

## 2026-06-17: Practice Feedback Uses Post-Submit Backend Correctness

Decision:
- The frontend submits a selected choice immediately when the learner clicks it.
- Correct/incorrect feedback and per-question session XP update after the nested session response endpoint returns `is_correct`.
- Do not show explicit "checking answer" copy or spinner for this step; the learner's selected answer should feel committed, not provisional.
- The difficulty buttons only move the local session forward until the backend accepts and stores an explicit confidence/rating field.

Rationale:
- Learner question payloads intentionally do not expose `correct_answer_index` before answering.
- Immediate submission is the earliest safe point for feedback without leaking answers before a learner commits.

Follow-up:
- GitHub #89 tracks the backend contract for post-submit answer reveal and difficulty rating persistence.
- To reveal the actual correct option after a wrong answer, the backend response endpoint should return a post-submit safe answer reveal field, such as `correct_answer_index` or `correct_choice`, only for the answered question.
- To make difficulty buttons real FSRS inputs, the backend should support persisting `confidence_rating` or an FSRS grade after the learner has seen feedback.

## 2026-06-17: MathLive Is Future-Only

Decision:
- `MathInput` remains as a reusable component for a future personal-problem solver.
- `PracticePage` must not import `MathInput`.
- Vite must not force a `math-vendor` chunk while MathLive is not part of the active product surface.

Rationale:
- A future solver may let learners upload a problem image or manually enter a math problem.
- Current sessions should not ship MathLive bundle cost or UI behavior while the feature is out of scope.

Follow-up:
- When the solver feature starts, reintroduce MathLive through that feature's route-level chunk.

## 2026-06-17: Frontend Curriculum Names Use Category And Topic

Decision:
- Frontend UI and docs use `category > topic` naming for curriculum organization.
- Backend contracts may still expose `topic`, `subtopic`, and `subtopic` ids.
- Mapping between frontend wording and backend fields belongs in service adapters and topic label utilities.

Rationale:
- `category` and `topic` are cleaner terms for the user interface.
- The backend data model still needs stable ids for relations, so frontend naming should not force risky backend churn.

Follow-up:
- If the backend later publishes a first-class `category` field, simplify the client-side grouping logic.

## 2026-06-17: Backend Work Is Tracked, Not Patched From Frontend

Decision:
- Backend files are read-only for this frontend cleanup.
- Backend concerns should be checked against local notes and GitHub issues before creating duplicates.

Already tracked:
- Bulk practice session create response schema: GitHub #80.
- OpenAPI schema warnings: GitHub #81.
- Full FSRS-5 algorithm: GitHub #38.
- Topics app endpoint/model refactor: GitHub #71.

Not duplicated:
- Server-side logout token revocation, because the backend now has `LogoutView` and refresh-token blacklisting.

Suggested issue commands:

```powershell
gh issue create --title "Add admin audit logs API" --label backend --label api --label enhancement --body "Expose a read-only GET /admin/audit-logs/ endpoint for authenticated admins. Include actor, action_type, target_resource, timestamp, and enough metadata for the frontend admin profile/activity surfaces."

gh issue create --title "Add user preferences persistence API" --label backend --label api --label enhancement --body "Persist user UI preferences such as language, theme, and notification settings. Suggested contract: PATCH /auth/users/me/preferences/ with a small JSON metadata payload so settings survive across devices."

gh issue create --title "Add admin system health telemetry API" --label backend --label api --label enhancement --body "Expose GET /admin/system-health/ for admin-only operational telemetry such as CPU, memory, storage, database connection status, and average API latency. This replaces simulated frontend health cards."
```

## 2026-06-17: E2E Tests Need A Dedicated Modernization Pass

Decision:
- Small stale assumptions can be removed during cleanup.
- The full Playwright suite should be fixed separately as a high-priority testing task.

Rationale:
- Current E2E failures include onboarding-aware learner flow, admin selector drift, and auth/setup assumptions.
- Fixing those properly needs test fixtures and role/session setup, not just selector edits.
