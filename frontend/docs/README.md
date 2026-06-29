# Frontend docs

Living frontend documentation. Point-in-time audit snapshots are intentionally
not kept here — they live in git history. Each doc below is meant to be updated
in place as the code changes.

| Doc | What it covers | Update when |
| --- | --- | --- |
| [DECISIONS.md](./DECISIONS.md) | Product & architecture decisions and their rationale | A non-obvious design choice is made or reversed |
| [backend_issues.md](./backend_issues.md) | Backend-owned issues / cross-contract notes that affect the frontend | A backend contract gap is found, fixed, or worked around |
| [testing_automation_plan.md](./testing_automation_plan.md) | Current test posture and the CI gates to run | Test gates or coverage strategy change |
| [demo_accounts.md](./demo_accounts.md) | Seeded demo accounts for local/Docker runs | Seed data or credentials change |

Endpoint contracts are **not** documented here — re-check them against the live
OpenAPI schema (`/docs/`, `/schema/`) during audits.
