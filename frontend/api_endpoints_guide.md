# Backend API Endpoints Guide

## 🔐 Authentication & Users
**Base path:** `/api/v1/`

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/auth/login/` | **POST** | Login and obtain JWT tokens (`access`, `refresh`) |
| `/auth/refresh/` | **POST** | Refresh an expired access token using the refresh token |
| `/auth/learner/register/` | **POST** | Register a new learner (auto-creates linked learner profile) |
| `/auth/admin/register/` | **POST** | Register a new admin |
| `/auth/users/me/` | **GET / PATCH** | Retrieve or update the currently authenticated user's account data |
| `/auth/learner/me/` | **GET** | Retrieve the authenticated learner's profile (XP, streak, etc.) |
| `/auth/admin/me/` | **GET** | Retrieve the authenticated admin's profile |
| `/auth/leaderboard/global/` | **GET** | Retrieve the global learner leaderboard rankings |
| `/auth/leaderboard/topic/<topic_id>/` | **GET** | Retrieve per-topic learner leaderboard rankings |

---

## 📝 Practice: Topics, Questions, Sessions & Mastery
**Base path:** `/api/v1/practice/`

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/topics/` | **GET / POST** | List all topics or create a new topic |
| `/topics/<id>/` | **GET / PUT / DELETE** | Retrieve, update, or delete a single topic |
| `/questions/` | **GET** | List all questions (ReadOnlyModelViewSet) |
| `/questions/<id>/` | **GET** | Retrieve a single question |
| `/sessions/` | **GET / POST** | List or create practice sessions |
| `/sessions/<id>/` | **GET / PATCH** | Retrieve or update (e.g. mark complete) a session |
| `/sessions/generate-adaptive/` | **GET** | Generate an adaptive session based on FIRe mastery |
| `/interactions/` | **POST** | Submit a question interaction result |
| `/mastery/` | **GET** | List the learner's topic mastery records |

---

## 📊 Analytics
**Base path:** `/api/v1/analytics/`

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/aggregated/` | **GET** | Retrieve aggregated platform metrics (admin-only) |
| `/topic/<topic_id>/` | **GET** | Retrieve analytics specific to a given topic ID |

---

## ⚠️ Notes for the Frontend Developer
- **Authentication**: All protected endpoints require an `Authorization` header with the Bearer scheme: `Authorization: Bearer <your_access_token>`.
- **Trailing Slashes**: Django API endpoints strictly require a trailing slash (e.g., `/auth/login/` not `/auth/login`), unless configured otherwise.
- **ReadOnly Questions**: The questions endpoint only supports GET. Create/edit/delete will return 405 until the backend upgrades from `ReadOnlyModelViewSet`.