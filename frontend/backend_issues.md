# LearnLab Backend-Owned Issues & Integration Notes

> Frontend-facing backend integration notes after merging `origin/master` into `interface`.
> Backend implementation is owned by `master`; this file should only list issues that still reproduce against the merged tree.

**Latest update:** 2026-06-22, merge verification in progress.

---

## Verification Checklist

- `backend` practice tests
- OpenAPI generation with `--fail-on-warn`
- Practice session create / submit / completion contract
- FSRS scheduling behavior and exposed response shape
- Auth/password reset email configuration via Docker environment
- Full Docker stack health
- Frontend consumers against the merged contracts

---

## Active Backend-Owned Issues

Pending re-verification against the merged `origin/master` code.

---

## Resolved Or Merged Backend Work To Confirm

- FSRS v1 scheduling engine and practice contract work from `origin/master`.
- Docker stack additions from `origin/master`.
- Password reset email environment/configuration changes from `origin/master`.
- Prior stale practice-test/schema warnings, if fixed by the merge.
