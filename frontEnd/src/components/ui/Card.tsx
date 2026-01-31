import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Card Component
 * 
 * A container component for grouping related content.
 * Follows composition pattern for flexibility.
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: 'default' | 'outlined' | 'elevated'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Make card hoverable with subtle animation */
  hoverable?: boolean
}

const variantStyles = {
  default: 'bg-white border border-neutral-200 shadow-sm',
  outlined: 'bg-white border-2 border-neutral-200',
  elevated: 'bg-white shadow-md',
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && 'transition-shadow duration-200 hover:shadow-md cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

/** Card Header - for title and actions */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        {(title || subtitle) ? (
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        ) : children}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

/** Card Content - main content area */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />
  }
)

CardContent.displayName = 'CardContent'

/** Card Footer - for actions at the bottom */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200', className)}
        {...props}
      />
    )
  }
)

CardFooter.displayName = 'CardFooter'
