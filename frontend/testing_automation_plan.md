# LearnLab Frontend Test Automation Notes

This document tracks the current frontend test posture and the remaining Playwright modernization work.

## Current Gates

Run these from `frontend/`:

```bash
bun run lint
bun run test:run
bun run i18n:check
bun run i18n:prune:check
bun run build
```

Current status:
- Unit and functional Vitest tests are the reliable local regression gate.
- Playwright specs live in `frontend/e2e/`, but they are not yet reliable enough to be a blocking gate.
- Generated Playwright artifacts are ignored through `playwright-report/` and `test-results/`.

## Known E2E Modernization Work

The Playwright suite should be kept in the repository, not gitignored. It currently needs a dedicated cleanup pass:

- Learner practice spec should handle first-run onboarding before expecting a direct dashboard session start.
- Practice selectors should use stable `data-testid` hooks instead of Tailwind class names.
- Admin question CRUD should select fields by accessible labels or `data-testid`, not positional `select` indexes.
- FSRS due-queue tests need backend-aware fixtures or API setup. Browser clock mocking alone cannot advance backend-side review dates.
- Current practice sessions are choice-based only. Do not reintroduce MathLive or written-answer assumptions into E2E session tests.

## Recommended Test IDs

Add stable selectors only where accessible roles/labels are not enough:

- `practice-start-button`
- `practice-question-card`
- `practice-option-{index}`
- `practice-feedback`
- `practice-grade-{grade}`
- `practice-complete-card`
- `admin-question-create`
- `admin-question-topic-select`
- `admin-question-correct-index`
- `admin-question-save`

## Manual QA Focus

Manual checks should focus on product feel and layout, not repetitive regression:

- Learner practice feedback timing and XP counter feel.
- Mobile and tablet layout for dashboards, forms, and practice sessions.
- Dark-mode contrast and RTL alignment.
- Admin form ergonomics for question and curriculum management.
