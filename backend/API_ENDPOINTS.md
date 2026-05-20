# LearnLab API Endpoints Summary

**Base URL**: `http://localhost:8000/api/v1`

## 1. Authentication & Users (`/auth/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/login/` | `POST` | Login via username/email & password. Returns JWT & user profile. |
| `/auth/refresh/` | `POST` | Refresh access token using refresh token. |
| `/auth/register/` | `POST` | Register a new user. |
| `/auth/users/me/` | `GET` | Get current user's profile and stats (Requires JWT). |
| `/auth/users/me/` | `PUT` / `PATCH` | Update current user's `first_name` and `last_name`. |
| `/auth/password-reset/` | `POST` | Request password reset (returns uid/token in dev console). |
| `/auth/password-reset/confirm/`| `POST` | Submit new password with uid & token. |

## 2. Practice & Sessions (`/practice/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/practice/questions/` | `GET` | List available questions. |
| `/practice/questions/<id>/` | `GET`/`POST`/`PUT`/`DEL` | Question CRUD (Write operations are Admin only). |
| `/practice/sessions/` | `POST` | Submit answered questions. Updates XP, streaks, and FSRS scheduling. |
| `/practice/learners/` | `GET` | List all learners. |
| `/practice/learners/leaderboard/`| `GET` | Get leaderboard. Supports filtering via `?topic=<topic_id>`. |

## 3. Topics & Subtopics (`/topics/` or `/topcis/`)
*Note: The backend accepts both `/topics/` and `/topcis/` due to a fallback.*
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/topcis/topics/` | `GET` | List all main topics. |
| `/topcis/subtopics/` | `GET` | List all subtopics. |
| `/topcis/mastery/` | `GET` | Get current user's mastery progress/records (Requires JWT). |

## 4. Analytics (`/analytics/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/analytics/aggregated/` | `GET` | Get overall app performance metrics (Requires JWT). |
| `/analytics/topics/<id>/` | `GET` | Get analytics specific to a topic (Requires JWT). |

---
**Test Accounts**
- **Admin**: `admin` / `admin123`
- **Learner**: `learner` / `learner123`
