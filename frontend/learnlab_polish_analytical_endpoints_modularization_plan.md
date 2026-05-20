# LearnLab Polish, Analytical Endpoints & Codebase Modularization Plan

**Goal:** Finish the last analytics-view polish, document backend telemetry endpoints needed for richer analytics, and outline frontend structural improvements that keep the codebase maintainable as features grow.

> Backend code is owned by the backend team and is read-only from the frontend side. Any backend work is captured as requests in `frontend/backend_issues.md`.

---

## 1) Current Integration Status (Frontend ↔ Backend)

### Authentication
- Frontend uses JWT bearer tokens.
- Endpoints in use: `POST /auth/login/`, `POST /auth/refresh/`, `POST /auth/register/`, `GET/PATCH /auth/users/me/`.

### Practice / Questions / Leaderboard
- Questions CRUD: `GET/POST/PUT/DELETE /practice/questions/`.
- Sessions: `GET/POST/PATCH /practice/sessions/`.
- Leaderboard: `GET /practice/learners/leaderboard/` (optionally filtered by `?topic=<id>`).

### Analytics
- Implemented and used today:
  - `GET /analytics/aggregated/` (overview stats)
  - `GET /analytics/topics/<topic_id>/` (per-topic drilldown)
- The admin analytics UI still contains local mock arrays for:
  - weekly activity charts
  - difficulty breakdown
  - bulk per-topic performance table

---

## 2) Backend Analytics Telemetry Endpoints (Requested)

The frontend can render a complete analytics dashboard without N+1 requests if the backend adds the following endpoints.

1) **`GET /analytics/topics/` (bulk)**
- One request returns per-topic metrics (speed/difficulty/retention/learner counts + optional distribution buckets).

2) **`GET /analytics/activity/` (historical)**
- Time-series buckets for daily/weekly active learners and questions answered.
- Suggested query: `?start=YYYY-MM-DD&end=YYYY-MM-DD` or `?period=7d|30d|90d`.

3) **`GET /analytics/difficulty/` (breakdown)**
- Attempts and accuracy broken down by difficulty tier (1/2/3).

See `frontend/backend_issues.md` → “Add High-Value Analytics Telemetry Endpoints”.

---

## 3) Frontend Codebase Structural Improvements (Recommended)

1) **Component splitting / file chunking**
- Split large pages into smaller presentational components (e.g. `TopicsPage` widgets, analytics widgets).

2) **Constants + service mappers**
- Move static configuration into `src/constants/`.
- Move backend-to-UI normalization into service-level mappers to keep TSX components clean.

3) **Centralized card/panel styling standard**
- Standardize “panel” and “card” surfaces via existing UI primitives (e.g. `Card` composition) and shared class recipes.

See `frontend/improvement_ideas.md` → “Codebase Structural Improvements”.

---

## 4) Verification Checklist (Frontend)

- Production build: `bun run build` (runs `tsc -b` + `vite build`).
- Optional:
  - Lint: `bun run lint`
  - Unit tests: `bun run test:run`
