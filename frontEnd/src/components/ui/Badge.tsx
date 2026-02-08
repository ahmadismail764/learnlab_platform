import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Badge Component
 * 
 * For status indicators, counts, and labels.
 * Great for achievements, levels, and topic tags.
 */

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  /** Show as a dot (for notifications) */
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
  primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  secondary: 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300',
  accent: 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300',
  success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    if (dot) {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-block w-2 h-2 rounded-full',
            variant === 'default' ? 'bg-neutral-400' :
            variant === 'primary' ? 'bg-primary-500' :
            variant === 'secondary' ? 'bg-secondary-500' :
            variant === 'accent' ? 'bg-accent-500' :
            variant === 'success' ? 'bg-green-500' :
            variant === 'warning' ? 'bg-yellow-500' :
            'bg-red-500',
            className
          )}
          {...props}
        />
      )
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
