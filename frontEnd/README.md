# 🎓 Learn Lab - Frontend

Educational LMS (Learning Management System) platform for Discrete Mathematics - first-year college students.

## Tech Stack

- **React 19** with React Compiler
- **TypeScript** (strict mode)
- **Vite 7** for blazing fast development
- **Tailwind CSS v4** for styling
- **Bun** as package manager

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
│   ├── ui/          # Base components (Button, Input, Card)
│   ├── layout/      # Layout components (Header, Sidebar)
│   └── common/      # Shared composite components
├── features/        # Feature modules (domain-driven)
│   ├── auth/        # Authentication feature
│   ├── student/     # Student-specific features
│   ├── admin/       # Admin-specific features
│   └── questions/   # Question/practice system
├── hooks/           # Shared custom hooks
├── contexts/        # React contexts (Auth, Theme, etc.)
├── services/        # API services & external integrations
├── utils/           # Utility functions
├── types/           # Shared TypeScript types
├── constants/       # App constants & config
├── routes/          # Route definitions
├── pages/           # Page components (route targets)
└── styles/          # Additional CSS (complex components)
```

## Design System

### Color Palette (Duolingo/Khan Academy inspired)

| Color | Purpose |
|-------|---------|
| **Primary (Green)** | Learning, Progress, Success |
| **Secondary (Blue)** | Information, Trust, Links |
| **Accent (Orange)** | Engagement, Streaks, Highlights |
| **Neutral (Gray)** | Text, Backgrounds, Borders |

### Typography

- **Body**: Inter
- **Headings**: Nunito

## User Roles (2-Role Model)

| Role | Description |
|------|-------------|
| **Student** | Primary learner - Solves problems, views leaderboard, progresses through topics |
| **Admin** | Content Manager - Manages question bank, monitors student analytics |

## Architecture Principles

This project follows **SOLID principles**:

1. **Single Responsibility** - Each component/hook does one thing
2. **Open/Closed** - Extensible via props, not modification
3. **Liskov Substitution** - Consistent interfaces
4. **Interface Segregation** - Small, focused prop interfaces
5. **Dependency Inversion** - Abstract API calls via services

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
