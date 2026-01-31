import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Input Component
 * 
 * A flexible input component with support for labels, errors, and icons.
 */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text shown below input */
  helperText?: string
  /** Icon to show on the left */
  leftIcon?: ReactNode
  /** Icon to show on the right */
  rightIcon?: ReactNode
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Make input full width */
  fullWidth?: boolean
}

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const hasError = Boolean(error)

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              'w-full rounded-lg border bg-white text-neutral-800',
              'placeholder:text-neutral-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:bg-neutral-100 disabled:cursor-not-allowed',
              // Size
              sizeStyles[size],
              // Icon padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Error state
              hasError
                ? 'border-error focus:ring-error/30'
                : 'border-neutral-300 focus:ring-primary-500/30 focus:border-primary-500',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
