# LearnLab Backend-Owned Issues & Integration Notes

> Frontend-facing backend integration notes after merging `origin/master` into `interface`.
> Backend implementation is owned by `master`; this file should only list issues that still reproduce against the merged tree.

**Latest update:** 2026-06-22 after merging `origin/master` into `interface`, adding backend to the local Docker stack, and verifying contracts against Docker.

---

## Verification Checklist

- Docker services: `db`, `redis`, `backend`, and `frontend`.
- `backend` practice tests.
- OpenAPI generation with `--fail-on-warn`.
- Practice session create / submit / completion contract.
- FSRS scheduling behavior and exposed response shape.
- Auth/password reset email configuration via Docker environment.
- Frontend consumers against the merged contracts.

---

## Active Backend-Owned Issues

### 1. Practice import blocks backend Docker startup

- **Status:** Active backend blocker, filed as GitHub #103.
- **Reproduction:** `docker compose up -d --build backend frontend`
- **Observed:** Backend exits before Django starts with `ImportError: cannot import name 'LeaderboardSerializer' from 'practice.serializers'`.
- **Cause:** `backend/practice/views.py` still imports `LeaderboardSerializer`, but leaderboard now lives under `topics`.
- **Frontend impact:** The frontend cannot verify the full Docker stack against unpatched backend source.
- **Local verification note:** Removing the stale import locally lets the backend boot. This is not a frontend-owned fix and should land through `master`.

### 2. Practice test/schema verification drift

- **Status:** Still backend-owned; related context added to GitHub #103.
- **Observed on unpatched merged source:**
  - `python manage.py test practice` still imports removed `QuestionResponseViewSet` through `backend/practice/tests.py`.
  - `python manage.py spectacular --file /tmp/schema.yaml --validate --fail-on-warn` still warns on `PracticeSessionViewSet` path parameter inference.
- **Local verification note:** Updating practice tests to the current routes and making the practice-session queryset schema-safe made both checks pass locally:
  - `docker compose exec -T backend uv run python manage.py test practice` passed, 19 tests.
  - `docker compose exec -T backend uv run python manage.py spectacular --file /tmp/schema.yaml --validate --fail-on-warn` passed.
- **Frontend impact:** Frontend should not add fallbacks for this. The live contract works after the backend cleanup, but backend CI/schema confidence needs the backend patch.

---

## Resolved Or Merged Backend Work Confirmed

- FSRS v1 scheduling engine is present (`fsrs==6.3.1`) with tests in `backend/practice/test_fsrs_engine.py`.
- Practice session contract works under the local backend verification patch:
  - `POST /api/v1/practice/sessions/?topic=<topic_id>` creates placeholder responses.
  - `GET /api/v1/practice/questions/<question_id>/` does not expose `correct_answer_index` to learners.
  - `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/` returns post-submit feedback and reveals `correct_answer_index`.
  - `PATCH /api/v1/practice/sessions/<session_id>/` completes the session and returns XP.
- Auth/preferences routes work over HTTP:
  - `POST /api/v1/auth/login/`
  - `GET /api/v1/auth/users/me/`
  - `PATCH /api/v1/auth/users/me/preferences/` with `{ "preferences": { ... } }`
- Analytics routes work with Redis in Docker; `GET /api/v1/analytics/aggregated/` returned review count, active users, mastery averages, and estimated retention.
- Password reset email configuration is now SMTP-backed in Docker:
  - `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
  - SMTP host/user/password are set.
  - reset links use `FRONTEND_URL=http://localhost:5173`.
- Docker stack health under the local backend verification patch:
  - `db` healthy.
  - `redis` healthy.
  - `backend` healthy.
  - `frontend` healthy.
