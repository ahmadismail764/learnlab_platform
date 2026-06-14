import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * Progress Components
 * 
 * For showing learning progress, completion rates, etc.
 */

// ============================================
// Progress Bar
// ============================================

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value (0-100) */
  value: number
  /** Maximum value */
  max?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'accent' | 'success'
  /** Show percentage label */
  showLabel?: boolean
  /** Animate the progress bar */
  animated?: boolean
  /** Custom class for the progress indicator */
  indicatorClassName?: string
}

const barSizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const barColorStyles = {
  primary: 'bg-linear-to-r from-primary-500 to-primary-400',
  secondary: 'bg-linear-to-r from-secondary-500 to-primary-500',
  accent: 'bg-linear-to-r from-accent-500 to-accent-400',
  success: 'bg-linear-to-r from-green-500 to-emerald-400',
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      variant = 'primary',
      showLabel = false,
      animated = true,
      indicatorClassName,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn(
            'w-full overflow-hidden rounded-full bg-neutral-200/85 shadow-inner ring-1 ring-black/5 dark:bg-neutral-800/85 dark:ring-white/6',
            barSizeStyles[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              'h-full rounded-full shadow-[0_0_18px_rgba(20,184,166,0.18)]',
              barColorStyles[variant],
              animated && 'transition-all duration-500 ease-out',
              indicatorClassName
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

// ============================================
// Progress Ring (Circular)
// ============================================

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value (0-100) */
  value: number
  /** Size in pixels */
  size?: number
  /** Stroke width */
  strokeWidth?: number
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'accent' | 'success'
  /** Show percentage in center */
  showLabel?: boolean
}

const ringColorStyles = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  accent: 'text-accent-500',
  success: 'text-green-500',
}

export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      className,
      value,
      size = 64,
      strokeWidth = 4,
      variant = 'primary',
      showLabel = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, value))
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('transition-all duration-500 ease-out', ringColorStyles[variant])}
          />
        </svg>
        
        {showLabel && (
          <span className="absolute text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)

ProgressRing.displayName = 'ProgressRing'
