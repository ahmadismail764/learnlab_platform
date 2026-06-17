# LearnLab Platform

## An Adaptive Discrete Mathematics Practice Platform

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

LearnLab helps learners replace passive content consumption with active, spaced retrieval practice focused on discrete mathematics topics. It schedules practice problems adaptively across topics and tracks learner progress.

**Contents**
- Features
- Tech stack
- Quick start (development)
- Running tests
- Contributing
- License & contact

**Features**
- Adaptive scheduling of practice using topic-based spaced repetition.
- Problem sessions with automatic scoring and progress tracking.
- Learner accounts, progress persistence, and reporting.
- Admin interface for managing content and topics.

**Tech stack**
- Backend: Django 6.x, Python 3.12+
- Frontend: React 18+, Vite + TypeScript
- Database: PostgreSQL 15+
- Styling: Tailwind CSS
- Optional: Docker + docker-compose for local full-stack development

**Quick start (development)**

Backend (Django):

1. Create and activate a virtual environment (recommended):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies and run migrations:

```bash
pip install -r requirements.txt
python manage.py migrate
```

3. (Optional) Create a superuser and run the development server:

```bash
python manage.py createsuperuser
python manage.py runserver
```

Frontend (React):

```bash
cd frontend
npm install
npm run dev
```

Full stack with Docker:

```bash
docker-compose up --build
```

Environment variables
- The project reads configuration from environment variables. If an example `.env` or docs exist, copy them into the appropriate backend/frontend places and set values (database URL, secret keys, etc.).

Running tests
- Backend (Django tests):

```bash
cd backend
python manage.py test
```

- Frontend unit/e2e tests:

```bash
cd frontend
npm test           # unit tests (if configured)
npx playwright test # end-to-end tests (Playwright)
```

Contributing
- Bug reports and pull requests are welcome. Please open issues describing the problem or enhancement, and include steps to reproduce.
- For code contributions: fork, create a feature branch, and open a pull request with a clear description.

License & contact
- This repository includes project-specific licensing in the repo; add or verify a `LICENSE` file as needed.
- For questions, open an issue or contact the maintainers via the project repository.

—

This README was updated to provide clearer developer setup and contribution guidance. If you'd like, I can also:

- Add a `docs/` folder with developer notes
- Create a `Makefile` or scripts for common tasks
- Add environment file examples (`backend/.env.example`)

Tell me which you'd prefer next.
