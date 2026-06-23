# UX Flow Audit - 2026-06-22

## Current Judgment

The core learner flow is in a good shape: login, dashboard, practice, progress,
and leaderboard now all point at live backend data instead of mock flows. The
dashboard is the strongest first screen because it answers "what should I do
now?" with due reviews, retention, XP, and the next session path.

## Onboarding Finding

The previous onboarding flow asked for a daily goal and topic choices, but those
choices were not used to configure the backend scheduler or practice queue. That
made the page feel like setup while acting mostly like static preferences.

Updated direction:

- Keep onboarding as a short orientation, not a required setup wizard.
- Let first-time learner login land there once, but keep a visible skip path.
- Explain LearnLab in practical terms: adaptive practice, smart review timing,
  and live progress.
- Send learners directly to practice, progress, or the dashboard.

## Remaining UX Follow-Up

- Add a small "Start here" affordance on empty dashboards for learners with no
  mastery data.
- Consider a real server-backed onboarding preference only if cross-device
  completion matters for the graduation demo.
- Later, if backend supports a learner confidence/rating field on practice
  submission, connect the current difficulty rating UI to that contract.
