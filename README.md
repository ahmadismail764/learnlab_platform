# LearnLab Platform

## **An Adaptive Discrete Mathematics Practice Platform with Topic-Based Spaced Repetition**

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

LearnLab is a Progressive Web Application (PWA) designed to replace passive video consumption with active, algorithmically-scheduled problem-solving for discrete mathematics. It combats the "illusion of competence" by prioritizing retrieval practice over passive reading.

## 🚀 Key Features

* **Topic-Based FSRS (Free Spaced Repetition Scheduler):** Instead of isolated flashcards, LearnLab schedules entire topics, generating fresh, parameterized problem instances to ensure genuine understanding. The system models memory stability to dynamically adjust review dates.
* **Adaptive Scaffolding:** Dynamically selects question complexity (Conceptual -> Application -> Complex Synthesis) based on your demonstrated FSRS stability metric.
* **Gamification:** Keeps learners engaged through XP, streak multipliers, and stability-based progress indicators.
* **Virtual Math Input:** Seamless integration of MathLive for precise symbolic notation (e.g., $\forall$, $\exists$, $\cup$, $\cap$).
* **Just-in-Time Resources:** Contextual hints and targeted video timestamps offered only when learners struggle.

## 🌐 Architecture & Integrations

LearnLab uses a decoupled architecture with a React frontend and Django REST Framework backend.

* **Authentication (`/api/v1/auth/`):** JWT-based secure login and registration.
* **Topics & Practice (`/api/v1/sessions/`):** Practice sessions are generated adaptively. Topics are prioritized based on their FSRS `next_review_date`.
* **Analytics (`/analytics/`):** Aggregated and topic-specific performance tracking.
* **Frontend State:** Includes live integration status badges and UI elements tracking backend data sources.

## 🛠️ Quick Start

### Prerequisites

* Python 3.12+
* Node.js 18+
* PostgreSQL 15+

### Backend Setup

```bash
# Clone and enter the directory
git clone https://github.com/ahmadismail764/learnlab_platform.git
cd learnlab_platform

# Setup virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment and run migrations
cp .env.example .env # Update with DB credentials
python manage.py migrate

# Seed test data (Optional)
python manage.py seed_test_data # Creates testlearner / testpass123

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
bun install
npm run dev
```

### Dev Utilities

* **Seed Data**: Run `python manage.py seed_test_data` to populate topics (e.g., Discrete Math, Python Basics) and create a test user (`testlearner` / `testpass123`).
* **Reminders**: Run `python manage.py send_reminders` to query for due practice reviews across the learner base and send alerts.

## 🤝 Contributing & License

Developed as part of a Computer Science graduation requirement. Contributions and PRs are welcome! Licensed for academic purposes.
