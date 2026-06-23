# Demo Accounts

These accounts are local QA/demo data for the Docker database. They use reserved
`example.test` email addresses and simple development passwords. They are not
production secrets, so this file is intentionally tracked.

## Login Quick-Fill

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Learner | `learner` | `learner@example.test` | `learner123` |
| Admin | `admin` | `admin@example.test` | `admin123` |

## Leaderboard Learners

| Username | Email | Password | XP | Streak |
| --- | --- | --- | ---: | ---: |
| `leader_alpha` | `leader.alpha@example.test` | `learner123` | 860 | 9 |
| `leader_beta` | `leader.beta@example.test` | `learner123` | 540 | 6 |
| `leader_gamma` | `leader.gamma@example.test` | `learner123` | 320 | 4 |

## Seeded Practice Data

- Topic: `Seeded Discrete Mathematics`
- Subtopic: `Seeded Logic Basics`
- Questions: 3 multiple-choice smoke-test questions

If the Docker database volume is reset, recreate this data from the repository
root with:

```powershell
powershell -ExecutionPolicy Bypass -File frontend/scripts/seed-demo-data.ps1
```
