# LearnLab Backend-Owned Issues & Integration Notes

> Frontend-facing backend integration notes after merging latest `origin/master`
> into `interface`. Backend source remains owned by `master`; this file should
> only list issues that still reproduce against the merged tree.

**Latest update:** 2026-06-24, local `interface` contains `origin/master`
`b17ef81` via merge commit `a0032a0`.

---

## Current Verification

- Docker services `db`, `redis`, `backend`, and `frontend` are healthy.
- `docker compose exec -T backend uv run python manage.py test practice` passes:
  12 tests.
- `docker compose exec -T backend uv run python manage.py spectacular --file /tmp/schema.yaml --validate --fail-on-warn` passes.
- Practice contract works through the frontend gateway:
  - `POST /api/v1/practice/sessions/?topic=<backend_topic_id>` accepts `{}` and creates placeholder responses.
  - `GET /api/v1/practice/questions/<question_id>/` does not expose `correct_answer_index` to learners.
  - `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/` accepts `selected_answer_index` and optional `confidence_rating`.
  - `PATCH /api/v1/practice/sessions/<session_id>/` completes the session when `end_time` is sent.
- Preferences now match the documented envelope contract:
  - frontend sends `PATCH /api/v1/auth/users/me/preferences/` with `{ "preferences": { ... } }`.
  - backend extracts and merges the envelope key.

---

## Active Backend-Owned Or Cross-Contract Issues

### 1. PDF question extraction endpoint exists, but current Docker env cannot run it

- **Endpoint:** `POST /api/v1/extract-questions/`
- **Access:** staff-only; learner request returns `403`.
- **Schema:** exposed as multipart upload with required `pdf_file` and optional `num_questions`.
- **Runtime dependency:** `GEMINI_API_KEY`.
- **Current Docker verification:** `GEMINI_API_KEY` is not set. A fake PDF upload returns:
  - `500 {"error": "GEMINI_API_KEY not found in environment variables."}`
- **Frontend status:** Admin UI now exposes this from the question bank as "Import Book" / "استيراد كتاب" and submits the real multipart contract.
- **Impact:** Backend has the ingestion path, but a clean Docker run cannot actually extract textbook questions until Gemini configuration is provided. Frontend should not add a cover-up fallback; the admin upload UI surfaces the backend/configuration failure.

### 2. Product taxonomy and backend taxonomy need a clearer contract

The product vocabulary is:

- frontend category -> frontend topic -> questions

The backend model is:

- backend `Topic` -> backend `Subtopic` -> `Question`

The intended mapping should be:

- frontend category = backend `Topic`
- frontend topic = backend `Subtopic`
- frontend question = backend `Question`

Current verified backend responses:

- `/api/v1/topics/` returns parent topics such as `Seeded Discrete Mathematics`.
- `/api/v1/subtopics/` returns rows with `topic`, `topic_name`, and subtopic `name`, such as `Seeded Logic Basics`.
- `/api/v1/practice/questions/` links questions to `subtopic`.
- `/api/v1/mastery/` currently exposes parent `topic` and `topic_name`, but not the underlying `subtopic` id/name.
- Practice session creation currently filters with `?topic=<backend_topic_id>`, not `?subtopic=<backend_subtopic_id>`.

**Impact:** The frontend can correctly create/edit questions by sending a backend `subtopic` id, but fully aligning learner/admin "topic" UX to backend subtopics needs either:

- backend mastery responses to include subtopic id/name and practice session creation to accept a subtopic filter, or
- a deliberate frontend compromise where subtopic cards still start broader parent-topic practice sessions.

Until that is resolved, "Uncategorized" or overly broad topic grouping can appear when the frontend derives categories from backend parent topic names.

### 3. Fresh Docker database volumes may still need test-role hardening

- The current local Docker database role `learnlab_app` has `CREATEDB`, so backend tests pass here.
- The committed `init-db.sh` creates `learnlab_app` without explicitly granting `CREATEDB`.
- `init.sql` is still present and contains invalid PostgreSQL `IF NOT EXISTS` syntax, though Compose currently mounts `init-db.sh` instead.

**Impact:** Fresh-volume backend test reliability may depend on role state unless the init script is hardened.

---

## Resolved Items Confirmed Against Latest Master

- Stale `LeaderboardSerializer` import no longer blocks backend startup.
- Stale `QuestionResponseViewSet` practice test import no longer reproduces.
- `PracticeSessionViewSet` OpenAPI path parameter warning no longer reproduces.
- FSRS scheduling is implemented through the `fsrs` package and wired to completed sessions.
- Password reset email is SMTP-configurable through Docker environment.
- Redis-backed analytics routes work in the full Docker stack.

---

## Frontend-Owned Notes

- Admin lazy chunk failures after Docker rebuild were fixed on the frontend side by:
  - serving `/admin` as an SPA route in `frontend/nginx.conf`;
  - adding chunk-load recovery to `ErrorBoundary`.
- Admin book upload UI is frontend-owned and now present on the question bank page. Full end-to-end extraction still needs a backend environment with `GEMINI_API_KEY`.
