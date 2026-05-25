import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts'
import { cn } from '@/utils/cn'

/**
 * ThemeToggle Component
 * 
 * Simple sun/moon toggle for switching between light and dark modes.
 * Shows sun in dark mode (to switch to light) and moon in light mode (to switch to dark).
 */

interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string
  /** Show system option in dropdown */
  showSystemOption?: boolean
}

export function ThemeToggle({ className, showSystemOption = false }: ThemeToggleProps) {
  const { isDark, toggleTheme, theme, setTheme } = useTheme()

  // Simple toggle version
  if (!showSystemOption) {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
          'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
          className
        )}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
    )
  }

  // Dropdown with system option
  return (
    <div className="relative group">
      <button
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
          'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
          className
        )}
        aria-label="Theme settings"
      >
        {theme === 'system' ? (
          <Monitor className="w-5 h-5" />
        ) : isDark ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown */}
      <div className={cn(
        'absolute top-full end-0 mt-1 py-1 min-w-[120px]',
        'bg-white dark:bg-neutral-800 rounded-lg shadow-lg',
        'border border-neutral-200 dark:border-neutral-700',
        'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
        'transition-all z-50'
      )}>
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'w-full px-3 py-2 text-sm text-start flex items-center gap-2',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            theme === 'light' 
              ? 'text-primary-600 dark:text-primary-400 font-medium' 
              : 'text-neutral-700 dark:text-neutral-300'
          )}
        >
          <Sun className="w-4 h-4" />
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'w-full px-3 py-2 text-sm text-start flex items-center gap-2',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            theme === 'dark' 
              ? 'text-primary-600 dark:text-primary-400 font-medium' 
              : 'text-neutral-700 dark:text-neutral-300'
          )}
        >
          <Moon className="w-4 h-4" />
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className={cn(
            'w-full px-3 py-2 text-sm text-start flex items-center gap-2',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            theme === 'system' 
              ? 'text-primary-600 dark:text-primary-400 font-medium' 
              : 'text-neutral-700 dark:text-neutral-300'
          )}
        >
          <Monitor className="w-4 h-4" />
          System
        </button>
      </div>
    </div>
  )
}
