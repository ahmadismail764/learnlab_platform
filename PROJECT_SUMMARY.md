# LearnLab Platform Architecture & Integration Summary

## 🚀 Key Update: FSRS Spaced Repetition Integration
The platform implements a mathematically optimized FSRS algorithm for spaced repetition. Development has shifted to tracking mastery at the **Topic level**, overriding per-question mastery logic.

### Backend Mechanism:
1. **TopicMastery Model**: Acts as an FSRS "card", persisting properties like `state`, `difficulty`, `stability`, `reps`, `lapses`, and `next_review_date`.
2. **Review Processing**: The FSRS engine calculates new stability/difficulty. During a practice session submission, user interactions are aggregated, and an average performance rating (1=Again, 2=Hard, 3=Good, 4=Easy) runs through the FSRS calculation once per topic.
3. **Adaptive Sheets (`GET /api/v1/sessions/generate-adaptive/`)**: Prioritizes topics that are "due" based on their `next_review_date`.

## 🌐 API Integrations & Frontend Status

### 🔐 Authentication (`/api/v1/auth/`)
- **Endpoints**: `register/`, `login/`, `refresh/`
- **Frontend Status**: Fully integrated. Local mock data was replaced by JWT-based login flows with error parsing.

### 📝 Topics & Questions (`/api/v1/`)
- **Endpoints**: `/topics/`, `/questions/` (Standard REST methods)
- **Frontend Status**: Integrated correctly with admin controls. 

### 🧠 Practice Sessions & Mastery (`/api/v1/`)
- **Endpoints**: `/sessions/` (List, Create, Update), `/mastery/` (Topic mastery state)
- **Frontend Status**: Integrated. `generateSheet()` maps to session creation, resolving legacy paths. 

### 📊 Analytics (`/analytics/`)
- **Endpoints**: `/aggregated/`, `/topic/<topic_id>/`
- **Frontend Status**: Integrated using explicit analytic request blocks.

### 🖥️ Frontend Specific Features
- **Integration Status Badge**: Active visual tracking on the frontend specifying if a view is `Backend Integrated`, `Partially Integrated`, or using `Static Demo Data`.
- **DataSource Breakdown**: Lists UI elements explicitly showing where data comes from (e.g. Leaderboard vs Question Bank vs UI Metrics).
- **Temporary Admin UI Access**: Fallback logic to authenticate a user visually as an admin strictly for testing, without hitting the backend toggle.

## 🛠️ Development & Testing Utilities

1. **Test Seed Data**  
   Run `python manage.py seed_test_data` to auto-populate the database.
   - **Credentials**: Username `teststudent` (Password: `testpass123`)
   - **Environment**: Automatically seeds topics like Discrete Math and Python Basics with varying Tiers.

2. **Reminders Generation**  
   Run `python manage.py send_reminders` to query for due practice reviews across the student base and send system-level reminder alerts.
