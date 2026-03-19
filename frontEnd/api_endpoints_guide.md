# Backend API Endpoints Guide

## 🔐 Authentication & Users
**Base path:** `/api/v1/`

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/auth/register/` | **POST** | Register a new user |
| `/auth/login/` | **POST** | Login and obtain JWT tokens (`access`, `refresh`) |
| `/auth/refresh/` | **POST** | Refresh an expired access token using the refresh token |
| `/users/me/` | **GET** | Retrieve the currently authenticated user's account data |
| `/students/me/` | **GET** | Retrieve the currently authenticated user's student profile data |
| `/leaderboard/` | **GET** | Retrieve the student leaderboard rankings |

---

## 📝 Topics & Questions
**Base path:** `/api/v1/`
*(These use standard RESTful routing. Examples below are for `GET`, but standard `POST`, `PUT`, `PATCH`, and `DELETE` methods are generally supported based on permissions)*

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/topics/` | **GET** | List all topics (or `POST` to create, `GET /topics/{id}/` for detail) |
| `/questions/` | **GET** | List all questions |
| `/sessions/` | **GET** | List practice sessions |
| `/mastery/` | **GET** | List topic mastery records |

---

## 📊 Analytics
**Base path:** `/analytics/`

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/aggregated/` | **GET** | Retrieve aggregated metrics for the user |
| `/topic/<topic_id>/` | **GET** | Retrieve analytics specific to a given topic ID |

---

## ⚠️ Notes for the Frontend Developer
- **Authentication**: All protected endpoints require an `Authorization` header with the Bearer scheme: `Authorization: Bearer <your_access_token>`.
- **Trailing Slashes**: Django API endpoints strictly require a trailing slash (e.g., `/auth/login/` not `/auth/login`), unless configured otherwise.