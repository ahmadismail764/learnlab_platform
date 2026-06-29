# LearnLab Backend-Owned Issues & Integration Notes

> Frontend-facing backend integration notes after merging latest `origin/master`
> into `interface`. Backend source remains owned by `master`; this file should
> only list issues that still reproduce against the merged tree.

**Latest update:** 2026-06-29. Local `interface` is at `HEAD 350b4bc` and now
contains `origin/master` through PR #120 (`b034167`), layered on top of the
earlier merge `a0032a0` (`origin/master b17ef81`). The notes below were
re-verified against backend source at this HEAD.

---

## Current Verification

Source-verified at `HEAD 350b4bc` (by reading the merged backend tree):

- Practice contract works through the frontend gateway:
  - `POST /api/v1/practice/sessions/?topic=<backend_topic_id>` accepts `{}` and creates placeholder responses.
  - Session creation now also accepts `?subtopic=<backend_subtopic_id>`, which takes precedence over `topic` when both are sent.
  - `GET /api/v1/practice/questions/<question_id>/` does not expose `correct_answer_index` to learners.
  - `PATCH /api/v1/practice/sessions/<session_id>/responses/<question_id>/` accepts `selected_answer_index` (MCQ) or `written_answer` (WRITTEN, plain ASCII math). A written answer that can't be parsed/graded returns `422` and is **not** recorded. The frontend no longer sends `confidence_rating` (see note below).
  - `PATCH /api/v1/practice/sessions/<session_id>/` completes the session when `end_time` is sent, and now returns a `next_review` headline via `PracticeSessionCompletionSerializer`.
- New FSRS review forecast endpoint: `GET /api/v1/practice/review-forecast/?days=N` (default 7, clamped to `[1, 30]`), returning a per-day agenda of due subtopics. Wired in `practice/urls.py`.
- Preferences match the documented envelope contract:
  - frontend sends `PATCH /api/v1/auth/users/me/preferences/` with `{ "preferences": { ... } }`.
  - backend extracts and merges the envelope key.

Needs a Docker re-run to re-confirm (not executed for this update; #120 changed the suite):

- Docker services `db`, `redis`, `backend`, `frontend` healthy.
- `docker compose exec -T backend uv run python manage.py test practice` — the practice suite is now **27 tests** (12 in `test_fsrs_engine.py`, 15 in `test_review_forecast.py`), up from 12 at the previous update.
- `docker compose exec -T backend uv run python manage.py spectacular --file /tmp/schema.yaml --validate --fail-on-warn`.

---

## Active Backend-Owned Or Cross-Contract Issues

### 1. PDF question extraction still requires `GEMINI_API_KEY` (config dependency, not a bug)

- **Endpoint:** `POST /api/v1/extract-questions/`
- **Access:** staff-only; learner request returns `403`.
- **Schema:** multipart upload with required `pdf_file` and optional `num_questions`.
- **Runtime dependency:** `GEMINI_API_KEY`.
- **Current behavior when the key is absent (verified):** `topics.services` raises `GeminiNotConfiguredError`, and `ExtractQuestionsAPIView` returns `503 {"error": "...", "hint": "Set GEMINI_API_KEY in backend/.env and restart the server."}`. (Previously this was an unhandled `500`; that has been fixed — see Resolved.)
- **Frontend status:** Admin UI exposes this from the question bank as "Import Book" / "استيراد كتاب" and submits the real multipart contract.
- **Impact:** The ingestion path exists and now fails cleanly, but a clean Docker run still cannot extract textbook questions until Gemini configuration is provided. Frontend should surface the `503`/`hint` rather than add a cover-up fallback.

### 2. Fresh Docker database volumes may still need test-role hardening

- The current local Docker database role `learnlab_app` has `CREATEDB`, so backend tests pass here.
- The committed `init-db.sh` (repo root, mounted by Compose) creates `learnlab_app` via `CREATE USER ... WITH PASSWORD` without explicitly granting `CREATEDB`.
- `init.sql` (repo root) is still present and contains invalid PostgreSQL syntax (`CREATE USER IF NOT EXISTS`, `CREATE DATABASE IF NOT EXISTS`), though Compose currently mounts `init-db.sh` instead.

**Impact:** Fresh-volume backend test reliability may depend on role state unless the init script is hardened.

---

## Resolved Items Confirmed Against Latest Master

- **Question extraction now returns `503` + `hint` instead of an unhandled `500`** when `GEMINI_API_KEY` is missing (PR #120 / fix #114, #117).
- **Taxonomy contract (former issue) is now aligned.** `SubtopicMasterySerializer` exposes `subtopic` id and `subtopic_name` (alongside `topic`/`topic_name`), and practice session creation accepts a `?subtopic=` filter that takes precedence over `?topic=`. The intended mapping — frontend category = backend `Topic`, frontend topic = backend `Subtopic`, frontend question = backend `Question` — is now fully expressible through the API. Any remaining work is frontend UX adoption, not a backend gap.
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
- Admin book upload UI is frontend-owned and present on the question bank page. Full end-to-end extraction still needs a backend environment with `GEMINI_API_KEY`; the UI should surface the backend `503`/`hint`.
- Review forecast surface (per-day FSRS agenda) is now consumable via `GET /api/v1/practice/review-forecast/?days=N`; the session-completion response also carries a `next_review` headline for post-session messaging.

## Frontend follow-ups adopted from #120 (2026-06-29)

- **Taxonomy aligned to DB→UI mapping** (DB topic = UI category, DB subtopic = UI topic, DB question = UI question). The mastery service (`services/topics.ts`) now returns one row per backend subtopic (no longer collapsed to parent topic) with explicit `subtopic`/`subtopic_name` (UI topic) and `topic`/`topic_name` (UI category). `TopicsPage` now browses backend subtopics as topic cards grouped by their backend topic (via new `useSubtopics` hook); `ProgressPage`, `LearnerDashboard`, and `LearnerProfilePage` render subtopic-level mastery.
- **Subtopic-scoped practice sessions**: `practiceService.createSession` accepts `subtopicId` → `?subtopic=` (mirrors backend precedence over `?topic=`); `PracticePage` reads `?subtopic=`, and learner practice links now pass `?subtopic=`.
- **503 hint surfaced**: `parseApiError` now appends the backend `hint` to `error` so the admin book-ingestion modal shows the `GEMINI_API_KEY` guidance.
- Unit tests in `tests/functional/services/{topics,practice}.test.ts` updated to the per-subtopic + subtopic-session contracts.

## Frontend follow-ups (post-audit pass)

- **Difficulty self-rating removed.** The learner no longer picks a 1–4 grade after answering. The backend scheduler (`fsrs_engine.process_session` → `aggregate_session_to_fsrs_rating`) already derives the FSRS outcome from correctness alone (any wrong → Again, all correct → Good) and ignores `confidence_rating`, so removing the manual step changes scheduling by zero. The frontend no longer sends `confidence_rating`.
- **Written-answer questions are now wired end-to-end (frontend).** Admin authoring (`QuestionFormModal`) supports a question-type toggle and a canonical `correct_answer` (plain ASCII math); the learner answers WRITTEN questions with a MathLive keyboard (`WrittenAnswerPanel`, lazy-loaded so MCQ-only sessions don't download MathLive). LaTeX is converted to ASCII via `convertLatexToAsciiMath` before submit. The `422` "unparseable" path keeps the question answerable for a retry instead of recording a wrong answer. Consumes `question_type`, `correct_answer`, `grading_method` (written defaults to CAS server-side).
- **Auth refresh hardened.** Backend `SIMPLE_JWT` runs `ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`, so `/auth/refresh/` returns a new refresh token and blacklists the old one. The frontend now persists the rotated refresh token (previously it kept the old, blacklisted one and the session died after one access lifetime) and uses a single-flight refresh so concurrent 401s don't rotate the token out from under each other.
