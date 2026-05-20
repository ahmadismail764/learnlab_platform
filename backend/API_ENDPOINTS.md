# LearnLab API Endpoints Summary

**Base URL**: `http://localhost:8000/api/v1`

---

## 1. Authentication & Users (`/auth/`)

### Login
* **Endpoint**: `POST /auth/login/`
* **Payload**:
  ```json
  {
    "username": "learner_username_or_email",
    "password": "learner_password"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "refresh": "eyJhbGciOi...",
    "access": "eyJhbGciOi...",
    "user": {
      "id": "c3b88934-2e99-4c8d-b988-1bcb0b03390b",
      "username": "learner",
      "email": "learner@learnlab.com",
      "is_staff": false,
      "first_name": "John",
      "last_name": "Doe",
      "role": "learner",
      "initials": "JD",
      "avatar_color": "hsl(210, 70%, 50%)"
    }
  }
  ```

### Refresh Token
* **Endpoint**: `POST /auth/refresh/`
* **Payload**: `{"refresh": "refresh_token"}`
* **Response (200 OK)**: `{"access": "new_access_token"}`

### Registration
* **Endpoint**: `POST /auth/register/`
* **Payload**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

### Current User Details
* **Endpoint**: `GET /auth/users/me/` (Requires JWT Authentication header)
* **Response (200 OK)**:
  ```json
  {
    "id": "c3b88934-2e99-4c8d-b988-1bcb0b03390b",
    "username": "learner",
    "email": "learner@learnlab.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_staff": false,
    "joined_at": "2026-05-20T11:22:33.456Z",
    "current_xp": 150,
    "streak_count": 3,
    "last_practice_date": "2026-05-19",
    "role": "learner",
    "initials": "JD",
    "avatar_color": "hsl(210, 70%, 50%)"
  }
  ```
* **Updates**: `PUT /auth/users/me/` or `PATCH /auth/users/me/` allows updating `first_name` and `last_name`.

### Password Reset
* **Request Reset**: `POST /auth/password-reset/`
  * **Payload**: `{"email": "john@example.com"}`
* **Confirm Reset**: `POST /auth/password-reset/confirm/`
  * **Payload**:
    ```json
    {
      "uid": "NQ",
      "token": "csa11a-...",
      "password": "new_secure_password"
    }
    ```

---

## 2. Practice & Sessions (`/practice/`)

### Questions CRUD
* **List Questions**: `GET /practice/questions/`
* **Detail/Edit/Delete**: `GET|PUT|DELETE /practice/questions/<uuid:id>/`
* **Question Schema**:
  ```json
  {
    "id": "5285701c-66f8-4e89-9831-299f104d41fa",
    "subtopic": "28ba01cc-55b8-4c8d-b988-1bcb0b03390a",
    "subtopic_name": "Algebra",
    "text": "Solve for x: 2x + 5 = 15",
    "choices": ["5", "10", "15", "20"],
    "correct_answer_index": 0,
    "tier": 1
  }
  ```

### Submit Practice Session
* **Endpoint**: `POST /practice/sessions/`
* **Payload**:
  ```json
  {
    "responses": [
      {
        "question": "5285701c-66f8-4e89-9831-299f104d41fa",
        "is_correct": true,
        "time_taken_seconds": 15,
        "confidence_rating": 4
      }
    ]
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "e3c88934-2e99-4c8d-b988-1bcb0b03390b",
    "learner": {
      "id": "c3b88934-2e99-4c8d-b988-1bcb0b03390b",
      "username": "learner",
      "current_xp": 160,
      "streak_count": 3
    },
    "start_time": "2026-05-20T11:22:33Z",
    "end_time": null,
    "total_xp_earned": 10,
    "responses": [
      {
        "id": "f8a88934-2e99-4c8d-b988-1bcb0b03390b",
        "question": "5285701c-66f8-4e89-9831-299f104d41fa",
        "is_correct": true,
        "time_taken_seconds": 15,
        "confidence_rating": 4
      }
    ]
  }
  ```

### Submit Individual Practice Response
* **Endpoint**: `POST /practice/sessions/<uuid:id>/responses/`
* **Payload**:
  ```json
  {
    "question": "5285701c-66f8-4e89-9831-299f104d41fa",
    "is_correct": true,
    "time_taken_seconds": 15,
    "confidence_rating": 4
  }
  ```
* **Response (201 Created)**: Returns the created `QuestionResponse` object. FSRS mastery and session XP are updated per response.

### Leaderboards & Learners
* **Learner List**: `GET /practice/learners/`
* **Leaderboard**: `GET /practice/learners/leaderboard/` (Supports filter `?topic=<uuid:topic_id>`)
* **Response Schema**:
  ```json
  [
    {
      "id": "c3b88934-2e99-4c8d-b988-1bcb0b03390b",
      "user": {
        "id": "c3b88934-2e99-4c8d-b988-1bcb0b03390b",
        "username": "learner",
        "first_name": "John",
        "last_name": "Doe"
      },
      "total_xp": 160,
      "streak_count": 3
    }
  ]
  ```

---

## 3. Topics & Subtopics (`/topics/`)

### Topics List
* **Endpoint**: `GET /topics/topics/`
* **Response**:
  ```json
  [
    {
      "id": "a1ba01cc-55b8-4c8d-b988-1bcb0b03390a",
      "name": "Mathematics",
      "description": "Fundamental calculations and equations",
      "parent_module": "Uncategorized",
      "question_count": 15
    }
  ]
  ```

### Subtopics List
* **Endpoint**: `GET /topics/subtopics/`
* **Response**:
  ```json
  [
    {
      "id": "28ba01cc-55b8-4c8d-b988-1bcb0b03390a",
      "topic": "a1ba01cc-55b8-4c8d-b988-1bcb0b03390a",
      "topic_name": "Mathematics",
      "name": "Algebra",
      "description": "Linear equations and inequalities",
      "question_count": 5
    }
  ]
  ```

### Topic Mastery Records
* **Endpoint**: `GET /topics/mastery/` (Requires JWT Authentication)
* **Response**:
  ```json
  [
    {
      "id": "84ba01cc-55b8-4c8d-b988-1bcb0b03390a",
      "topic": "a1ba01cc-55b8-4c8d-b988-1bcb0b03390a",
      "topic_name": "Mathematics",
      "rep_num": 1,
      "memory": 0.9,
      "speed": 1.0,
      "difficulty": 5.0,
      "status": "learned",
      "last_reviewed": "2026-05-20T11:22:33Z",
      "next_due": "2026-05-21T11:22:33Z"
    }
  ]
  ```

---

## 4. Analytics (`/analytics/`)

### Aggregated Performance Metrics
* **Endpoint**: `GET /analytics/aggregated/` (Requires JWT Authentication)
* **Response**:
  ```json
  {
    "review_count": 10,
    "active_users": {
      "7_days": 1,
      "30_days": 1
    },
    "mastery_averages": {
      "avg_speed": 1.0,
      "avg_difficulty": 5.0
    },
    "estimated_retention": 0.885
  }
  ```

### Topic-specific Analytics Distribution
* **Endpoint**: `GET /analytics/topics/<uuid:topic_id>/` (Requires JWT Authentication)
* **Response**:
  ```json
  {
    "topic_id": "a1ba01cc-55b8-4c8d-b988-1bcb0b03390a",
    "metrics": {
      "avg_speed": 1.0,
      "avg_difficulty": 5.0,
      "learner_count": 1
    },
    "distribution": {
      "low_speed": 1,
      "medium_speed": 0,
      "high_speed": 0
    }
  }
  ```

---

## Test Accounts
* **Admin**: `admin` / `admin123`
* **Learner**: `learner` / `learner123`
