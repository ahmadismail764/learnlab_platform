# Project Overview: LearnLab Platform

## 1. Repo Structure

Here is the high-level tree structure of the repository:

```text
learnlab_platform/
├── backend/                  # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── analytics/            # App for analytics and tracking
│   ├── learnlab_platform/    # Main Django project configuration
│   ├── questions/            # App for managing questions, topics, and practice sessions
│   └── users/                # App for user management (learners, admins)
├── frontend/                 # React + Vite + TypeScript frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/
│   ├── scripts/
│   └── src/                  # React source code (components, pages, context, etc.)
├── diagrams/                 # Architecture and design diagrams (Mermaid, UML)
└── README.md
```

## 2. Brief Description

**LearnLab** is a gamified educational platform designed for interactive learning and practice. It features a decoupled architecture containing a Django backend and a React/TypeScript frontend.

- **Backend (`backend/`)**: Handles core business logic, including user management (Learners, Admins), educational content categorization (Topics, Questions, Modules), practice sessions, and gamification tracking (XP, streaks, topic mastery levels).
- **Frontend (`frontend/`)**: Provides the user interface for learners to participate in practice sessions, view their mastery/analytics, and for administrators to manage content, fully localized with i18n support.

## 3. Specific Areas of Concern / Focus

Based on recent activity and the current state of the repository, here are immediate areas to focus on:

1. **Admin/Model Synchronization**: There are unresolved discrepancies between Django models and their Admin representations. E.g., `PracticeSessionAdmin` referencing missing fields (`session_type`, `total_xp_earned`) and `TopicAdmin` referencing `parent_module`. The database schema (models) and the admin panels need to be explicitly reconciled.
2. **Users App Abstraction**: The ongoing branch `feature/backend-users-abstraction` indicates work on decoupling/abstracting user roles (e.g., Learners vs Admins). Ensuring clean polymorphic associations or proxy models without breaking authentication is critical.
3. **Analytics & Mastery Tracking**: The recent migrations in `questions` (like `0005_topicmastery_lapses...`) indicate rapid changes to how learning progression and spaced repetition are tracked. Validating this logic against user sessions and zero-data states will be a key priority.

## 4. Git Information

The repository currently utilizes a multi-branch workflow. Here are the active local branches:

- `master` (Default branch)
- `feature/backend-users-abstraction` (Current active branch)
- `view_implementation2`
- `interface`
- `backend-updates`
- `antigravity-backup`
