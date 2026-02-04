# 🎓 Learn Lab - Frontend

Educational LMS (Learning Management System) platform for Discrete Mathematics - first-year college students.

## Tech Stack

- **React 19** with React Compiler
- **TypeScript** (strict mode)
- **Vite 7** for blazing fast development
- **Tailwind CSS v4** for styling
- **Bun** as package manager
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
├── assets/          # Static assets (images, fonts, icons)
├── components/      # Shared UI components
│   ├── ui/          # Base components (Button, Input, Card, Badge, Avatar, Progress, EmptyState, Loading)
│   ├── layout/      # Layout components (Header, Sidebar, StudentLayout)
│   ├── common/      # Shared composite components (NotificationDropdown)
│   ├── MathInput    # MathLive virtual keyboard component for math expressions
│   └── LanguageSwitcher # EN/AR language toggle
├── contexts/        # React contexts
│   ├── AuthContext  # Authentication state & user management
│   └── NotificationContext # Toast notifications system
├── hooks/           # Custom hooks
│   └── useLocalStorage # Persistent state management
├── data/            # Mock data & question pools
│   └── sampleQuestions # MC, True/False, and Essay questions
├── locales/         # i18n translation files
│   ├── en/          # English translations (10 namespaces)
│   └── ar/          # Arabic translations (RTL)
├── types/           # Shared TypeScript types
├── pages/           # Page components
│   ├── auth/        # Login page
│   ├── student/     # Student pages (Dashboard, Topics, Practice, Progress, Achievements)
│   └── admin/       # Admin pages (Dashboard, Questions, Analytics, Settings)
└── styles/          # Global styles & Tailwind config
```

## Features

### 🎯 Practice System
- **Multiple Choice Questions** - Traditional 4-option questions
- **True/False Questions** - Binary choice questions
- **Essay Questions with MathLive** - Mathematical expression input with virtual keyboard
  - LaTeX-based input/output
  - Discrete math keyboard layouts (numeric, symbols, Greek letters)
  - Flexible answer matching with alternative answers

### 📊 Progress Tracking
- Topic-based progress with mastery levels
- Session statistics (accuracy, time spent)
- Visual progress indicators

### 🏆 Achievements System
- Unlock achievements based on performance
- Multiple achievement tiers (bronze, silver, gold, platinum)
- Detailed achievement reasons/criteria

### 🌐 Internationalization
- Full English and Arabic support
- RTL layout for Arabic
- 10 translation namespaces (common, auth, student, practice, etc.)

### 🔔 Notifications
- Toast notification system
- Success, error, warning, info types
- Auto-dismiss with configurable duration

## Question Types

| Type | Description | Answer Format |
|------|-------------|---------------|
| **Multiple Choice** | 4 options, single correct answer | Select one option |
| **True/False** | Binary choice | Select True or False |
| **Essay (Math)** | Open-ended math expression | LaTeX via MathLive keyboard |

### Essay Question Topics (1 per category)
- **Logic**: Contrapositive notation
- **Sets**: Symmetric difference
- **Relations**: Equivalence class notation
- **Combinatorics**: Combination formula
- **Graph Theory**: Complete graph edges
- **Number Theory**: Euclidean algorithm GCD

## Design System

### Color Palette (Duolingo/Khan Academy inspired)

| Color | Purpose |
|-------|---------|
| **Primary (Green)** | Learning, Progress, Success |
| **Secondary (Blue)** | Information, Trust, Links |
| **Accent (Orange)** | Engagement, Highlights |
| **Neutral (Gray)** | Text, Backgrounds, Borders |

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
| **Student** | Primary learner - Solves problems, tracks progress, earns achievements |
| **Admin** | Content Manager - Manages question bank, monitors analytics, configures settings |

### Admin Features

| Page | Description |
|------|-------------|
| **Dashboard** | System overview with quick stats and recent activity |
| **Questions** | Question bank management with filtering, search, and preview |
| **Analytics** | Student analytics dashboard with charts and performance metrics |
| **Settings** | System settings (general, notifications, security, practice, theme) |

## Architecture Principles

This project follows **SOLID principles**:

1. **Single Responsibility** - Each component/hook does one thing
2. **Open/Closed** - Extensible via props, not modification
3. **Liskov Substitution** - Consistent interfaces
4. **Interface Segregation** - Small, focused prop interfaces
5. **Dependency Inversion** - Abstract API calls via services

---

## Development Notes

### Adding New Questions

Questions are defined in `src/data/sampleQuestions.ts`:

```typescript
// Multiple Choice
{
  id: 'unique-id',
  topic: 'logic',
  difficulty: 1, // 1-3
  content: 'Question text',
  answerType: 'multipleChoice',
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 'A',
}

// Essay (Math Expression)
{
  id: 'unique-id',
  topic: 'sets',
  difficulty: 2,
  content: 'Write the formula for...',
  answerType: 'essay',
  correctAnswer: '\\Delta = (A \\setminus B) \\cup (B \\setminus A)',
  alternativeAnswers: ['(A - B) \\cup (B - A)'],
}
```

### Translation Keys

Translations use namespaced keys. Add new translations to both `en/` and `ar/` folders:

```typescript
// Usage in components
const { t } = useTranslation()
t('practice:submitAnswer') // => "Submit Answer" or "إرسال الإجابة"
```

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
