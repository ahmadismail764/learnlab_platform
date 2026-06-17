# 🎓 Learn Lab - Frontend

Educational LMS (Learning Management System) platform for Discrete Mathematics - first-year college students.

## Tech Stack

- **React 19** with React Compiler
- **TypeScript** (strict mode)
- **Vite 7** for blazing fast development
- **Tailwind CSS v4** for styling
- **Bun** as the primary package/script runner
- **i18next** for internationalization (English/Arabic with RTL support)
- **MathLive** for mathematical expression input with virtual keyboard

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run linter
bun run lint
```

## Project Structure

```
src/
├── components/      # Shared UI components
│   ├── ui/          # Base components (Button, Input, Card, Badge, Avatar, Progress, EmptyState, Loading)
│   ├── layout/      # Layout components (Header, Sidebar, DashboardLayout, AuthLayout)
│   ├── common/      # Shared composite components (PageIntro, PageStatCard, SectionHeading)
│   ├── MathInput    # MathLive virtual keyboard component for math expressions
│   └── LanguageSwitcher # EN/AR language toggle
├── contexts/        # React contexts
│   ├── AuthContext  # Authentication state & user management
│   ├── ThemeContext # Theme persistence and dark mode
│   └── ToastContext # Toast notifications system
├── hooks/           # React Query hooks and reusable browser hooks
├── locales/         # i18n translation files
│   ├── en/          # English translations (9 namespaces)
│   └── ar/          # Arabic translations (RTL)
├── routes/          # React Router route definitions and lazy wrappers
├── services/        # Backend API service adapters and mappers
├── test-utils/      # Shared Vitest/Testing Library helpers
├── types/           # Shared TypeScript types
├── validation/      # Centralized input validation schemas (Zod)
├── pages/           # Page components
│   ├── auth/        # Login, registration, and password reset pages
│   ├── learner/     # Learner pages (Dashboard, Topics, Practice, Progress, Leaderboard, Profile)
│   └── admin/       # Admin pages (Dashboard, Curriculum, Questions, Analytics, Settings, Profile)
└── index.css        # Tailwind v4 theme, globals, and reusable surfaces
```

## Features

### 🎯 Practice System
- **Multiple Choice Questions** - Traditional 4-option questions
- **True/False Questions** - Binary choice questions
- **Adaptive Review Sessions** - Backend-generated practice sets with FSRS-style review signals
- **MathLive Component** - Retained as a reusable math input for future personal-problem solving flows

### 📊 Progress Tracking
- Topic-based progress with mastery levels
- Session statistics (accuracy, time spent)
- Visual progress indicators

### 🏆 Motivation Signals
- XP totals and streak tracking
- Topic mastery status
- Leaderboard rank visibility

### Leaderboard
- Weekly, monthly, and all-time rankings
- Own rank highlight with streaks display
- Offline banner and empty state handling

### 📚 Curriculum Management (Admin)
- Topic list organized by frontend-derived categories
- Create/Edit topics with name and description
- Duplicate name validation and cascade delete warnings

### 🌐 Internationalization
- Full English and Arabic support
- RTL layout for Arabic
- 9 translation namespaces (common, auth, nav, learner, admin, practice, topics, language, profile)

### 🔔 Notifications
- Toast notification system
- Success, error, warning, info types
- Auto-dismiss with configurable duration

## Question Types

| Type | Description | Answer Format |
|------|-------------|---------------|
| **Multiple Choice** | 4 options, single correct answer | Select one option |
| **True/False** | Binary choice | Select True or False |

Open-ended written math is intentionally not part of the current review-session experience. A future optional solver can reuse `MathInput` for user-owned problems, where a learner either uploads a picture or enters a problem manually to receive a guided solution.

## Design System

### Brand Identity

The name **LearnLab** evokes experimentation and discovery. The logo uses connected graph nodes forming an "L" shape — a direct reference to discrete-mathematics graph theory.

### Color Palette

| Color | Usage |
|-------|-------|
| **Primary (Teal)** | Scientific, fresh — learning, progress, CTAs |
| **Secondary (Violet)** | Intelligence, depth — discovery, admin |
| **Accent (Amber)** | Energy, warmth — achievements, streaks, XP |
| **Neutral (Gray)** | Text, backgrounds, borders |

### Typography

- **Body**: Inter
- **Headings**: Nunito

### UI Components

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost, danger variants |
| `Card` | Content container with hover effects |
| `Badge` | Status indicators, difficulty tiers |
| `Avatar` | User profile images with fallback |
| `Progress` | Linear and circular progress bars |
| `Input` | Form inputs with validation states |
| `Loading` | Spinner and skeleton loaders |
| `EmptyState` | Placeholder for empty content |
| `MathInput` | MathLive wrapper with virtual keyboard |

## User Roles (2-Role Model)

| Role | Description |
|------|-------------|
| **Learner** | Primary learner - Solves problems, tracks progress, earns achievements |
| **Admin** | Content Manager - Manages question bank, monitors analytics, configures settings |

### Admin Features

| Page | Description |
|------|-------------|
| **Dashboard** | System overview with quick stats and recent activity |
| **Curriculum** | Topic management with category grouping, CRUD, and cascade delete warnings |
| **Questions** | Question bank management with CRUD, filtering, search, and preview |
| **Analytics** | Learner analytics with FSRS metrics, topic search/filter, and export |
| **Settings** | System settings (general, notifications, security, practice, theme) |
| **Profile** | Admin profile page |

## Architecture Principles

This project follows **SOLID principles**:

1. **Single Responsibility** - Each component/hook does one thing
2. **Open/Closed** - Extensible via props, not modification
3. **Liskov Substitution** - Consistent interfaces
4. **Interface Segregation** - Small, focused prop interfaces
5. **Dependency Inversion** - Abstract API calls via services

---

## Development Notes

Important frontend product and architecture decisions are tracked in [DECISIONS.md](./DECISIONS.md).

### API Contract Reviews

- Use the live Django OpenAPI outputs as the source of truth for endpoint shape:
  - YAML schema: `http://localhost:8000/schema/`
  - Interactive docs: `http://localhost:8000/docs/`
- Do not add static frontend API reference documents that duplicate Swagger/OpenAPI. Frontend-side docs may track frontend implementation decisions, temporary fallbacks, or backend issue summaries, but endpoint contracts should be re-checked against the live schema during audits.
- Frontend services should consume the backend contract as published. Avoid compatibility fallbacks that hide backend contract failures unless a temporary fallback is explicitly approved and documented with a removal condition.

### Curriculum Naming

- Use `category > topic > subtopic` for frontend naming. A category is the UI grouping for topics, like Math grouping Calculus, Algebra, and Functions.
- Do not use `parent_module`, `parentModule`, or "module" naming for topic grouping in frontend code, translations, forms, or docs.
- `/topics/` responses are normalized in `src/services/topics.ts`. Category grouping is derived client-side in `src/utils/topicLabels.ts` unless the backend publishes a clean `category` field.

### Translation Keys

Translations use namespaced keys. Add new translations to both `en/` and `ar/` folders:

```typescript
// Usage in components
const { t } = useTranslation()
t('practice:startSession') // => "Start session" or "ابدأ الجلسة"
```
