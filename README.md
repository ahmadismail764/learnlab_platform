# LearnLab Platform

**An Adaptive Discrete Mathematics Practice Platform with Topic-Based Spaced Repetition**

A Progressive Web Application (PWA) designed to replace passive video consumption with active, algorithmically-scheduled problem-solving for discrete mathematics education.

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

---

## Table of Contents

- [The Problem: Illusion of Competence](#the-problem-illusion-of-competence)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [System Analysis \& Design](#system-analysis--design)
- [Core Algorithms](#core-algorithms)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## The Problem: Illusion of Competence

Traditional learning methods for discrete mathematics suffer from a well-documented cognitive trap: **the illusion of competence**. Students watch hours of video lectures, passively nodding along, and mistake _recognition_ for _recall_. Research in cognitive psychology consistently demonstrates that:

> "Students who re-read material or watch explanatory videos often perform worse on assessments than those who engage in retrieval practice, despite reporting higher confidence in their understanding."  
> — _Roediger & Karpicke, 2006_

The standard approach fails because:

| Method                 | Perceived Learning | Actual Retention |
| ---------------------- | ------------------ | ---------------- |
| Passive Video Watching | High               | Low              |
| Re-reading Notes       | High               | Low              |
| Active Recall Practice | Moderate           | **High**         |
| Spaced Retrieval       | Moderate           | **Very High**    |

Existing solutions like Anki address spaced repetition but schedule **isolated flashcards**, not interconnected topics. Students memorize answers to specific cards rather than developing transferable problem-solving skills.

---

## Our Solution

LearnLab reimagines discrete math practice through three core principles:

1. **Topic-Level Scheduling**: Instead of individual cards, the system schedules entire topics (e.g., "Propositional Logic," "Set Operations") and generates **fresh problem instances** on each review. This prevents pattern matching and forces genuine understanding.

2. **Adaptive Scaffolding**: The platform dynamically adjusts question complexity based on demonstrated mastery, guiding learners through a structured progression from definitions to synthesis.

3. **Active Practice First**: No 45-minute lectures. Learners immediately engage with problems, with just-in-time video timestamps available only when needed.

---

## Key Features

### Topic-Based Spaced Repetition System (SRS)

Unlike traditional flashcard applications that schedule individual cards, LearnLab operates at the **topic granularity**. When a topic is due for review:

- The system generates new problem instances from parameterized templates
- Variables, sets, and logical structures are randomized
- Students cannot rely on memorized answers—only genuine understanding suffices

### Adaptive Scaffolding Engine

Based on the learner's **FSRS stability metric**, the system dynamically selects appropriate question tiers:

| Stability Level     | Question Tier | Description                                  |
| ------------------- | ------------- | -------------------------------------------- |
| Low (S < 5)         | **Tier 1**    | Conceptual definitions and basic recognition |
| Medium (5 ≤ S < 20) | **Tier 2**    | Application and procedural problems          |
| High (S ≥ 20)       | **Tier 3**    | Complex synthesis and proof construction     |

This ensures learners are neither overwhelmed nor under-challenged, maintaining optimal cognitive load throughout their practice sessions.

### Gamification System

Engagement is sustained through a carefully designed reward structure:

- **Experience Points (XP)**: Awarded based on problem difficulty tier and correctness
- **Streak Multipliers**: Consecutive correct answers amplify XP gains
- **Progress Visualization**: Topic mastery displayed through stability-based progress indicators

### Virtual Mathematics Input

Discrete mathematics requires precise symbolic notation. LearnLab integrates **MathLive** for seamless input of:

- Logical operators: $\land$, $\lor$, $\lnot$, $\to$, $\leftrightarrow$
- Quantifiers: $\forall$, $\exists$
- Set notation: $\in$, $\subseteq$, $\cup$, $\cap$, $\emptyset$
- Fully optimized for mobile touch input

### Just-in-Time Learning Resources

When learners struggle, they receive:

- Targeted YouTube timestamps (not full videos)
- Contextual hints based on common misconceptions
- Worked examples that scaffold toward the current problem type

---

## System Analysis & Design

This section presents the architectural artifacts developed during the analysis and design phase of the project.

### Use Case Diagram

The use case diagram illustrates the primary actors and their interactions with the LearnLab platform.

![Use Case Diagram](./docs/diagrams/use-case-diagram.png)

### Entity-Relationship Diagram (ERD)

The ERD models the persistent data structures and their relationships within the PostgreSQL database.

![Entity-Relationship Diagram](./docs/diagrams/erd.png)

### Class Diagram

The class diagram presents the object-oriented structure of the backend services, including the FSRS scheduler and scaffolding engine.

![Class Diagram](./docs/diagrams/class-diagram.png)

### Sequence Diagrams

#### Practice Session Flow

Illustrates the interaction between components when a learner initiates a practice session.

![Practice Session Sequence Diagram](./docs/diagrams/sequence-practice-session.png)

#### Adaptive Question Selection

Details the algorithmic flow for selecting appropriately-tiered questions based on stability metrics.

![Question Selection Sequence Diagram](./docs/diagrams/sequence-question-selection.png)

---

## Core Algorithms

### FSRS (Free Spaced Repetition Scheduler)

LearnLab employs the FSRS algorithm, a modern spaced repetition scheduler that models memory using four parameters:

```
State = (Stability, Difficulty, ElapsedDays, ScheduledDays)
```

**Stability (S)**: The number of days until recall probability drops to 90%. Higher stability indicates stronger memory consolidation.

**Retrievability (R)**: The probability of successful recall at a given moment, calculated as:

$$R(t) = e^{\frac{t}{S} \cdot \ln(0.9)}$$

Where $t$ is the elapsed time since last review.

### Scaffolding Integration

The scaffolding engine extends FSRS by mapping stability values to question tiers:

```python
def select_tier(stability: float) -> int:
    if stability < 5:
        return 1  # Conceptual/Definitions
    elif stability < 20:
        return 2  # Application
    else:
        return 3  # Complex Synthesis
```

After each response, the system:

1. Updates FSRS parameters based on response quality
2. Recalculates stability
3. Adjusts the next review interval
4. Re-evaluates the appropriate question tier

This creates a feedback loop where demonstrated mastery unlocks progressively challenging content.

---

## Tech Stack

### Frontend

| Technology   | Purpose                         |
| ------------ | ------------------------------- |
| React.js 18+ | Component-based UI architecture |
| Tailwind CSS | Utility-first styling           |
| MathLive     | Mathematical expression input   |
| Workbox      | PWA service worker management   |

### Backend

| Technology            | Purpose                     |
| --------------------- | --------------------------- |
| Python 3.12+          | Core runtime                |
| Django 6.0            | Web framework and ORM       |
| Django REST Framework | API layer                   |
| FSRS (py-fsrs)        | Spaced repetition algorithm |

### Infrastructure

| Technology     | Purpose                          |
| -------------- | -------------------------------- |
| PostgreSQL 15+ | Primary database                 |
| Nginx          | Reverse proxy and static serving |

### Development Tools

| Tool         | Purpose                     |
| ------------ | --------------------------- |
| PlantUML     | UML diagram generation      |
| pytest       | Testing framework           |
| Black / Ruff | Code formatting and linting |

---

## Installation

### Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- PostgreSQL 15 or higher
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/ahmadismail764/learnlab_platform.git
cd learnlab_platform

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Apply database migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
DB_NAME=learnlab_platform_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your_django_secret_key
DEBUG=True
```

---

## Project Structure

```
learnlab_platform/
├── learnlab_platform/       # Django project configuration
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/            # User authentication and profiles
│   ├── topics/              # Topic and problem management
│   ├── practice/            # Practice session logic
│   ├── scheduler/           # FSRS and scaffolding engine
│   └── gamification/        # XP and progression system
├── frontend/                # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
├── docs/
│   └── diagrams/            # PlantUML source and rendered PNGs
├── tests/
├── requirements.txt
└── README.md
```

---

## Contributing

This project is developed as part of a Computer Science graduation requirement. Contributions, suggestions, and feedback are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

---

## License

This project is developed for academic purposes as part of a Bachelor's degree in Computer Science.

---

## Acknowledgments

- **FSRS Algorithm**: Open-source spaced repetition scheduler by Jarrett Ye
- **MathLive**: Mathematical input library by Arno Gourdol
- **Cognitive Science Research**: Roediger, Karpicke, and the retrieval practice literature

---

<p align="center">
  <i>Built with a commitment to evidence-based learning.</i>
</p>
