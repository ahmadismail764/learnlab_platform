import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  /** Current theme setting (light, dark, or system) */
  theme: Theme
  /** Resolved theme (always light or dark based on system or manual) */
  resolvedTheme: 'light' | 'dark'
  /** Whether dark mode is currently active */
  isDark: boolean
  /** Set theme to light, dark, or system */
  setTheme: (theme: Theme) => void
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

