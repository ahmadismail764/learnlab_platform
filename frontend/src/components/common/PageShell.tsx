import type { HTMLAttributes, ReactNode } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

type PageTone = 'primary' | 'secondary' | 'accent' | 'neutral' | 'success'

const toneStyles: Record<PageTone, { pill: string; icon: string; iconColor: string }> = {
  primary: {
    pill: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    icon: 'bg-primary-100 dark:bg-primary-900/30',
    iconColor: 'text-primary-600 dark:text-primary-300',
  },
  secondary: {
    pill: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
    icon: 'bg-secondary-100 dark:bg-secondary-900/30',
    iconColor: 'text-secondary-600 dark:text-secondary-300',
  },
  accent: {
    pill: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
    icon: 'bg-accent-100 dark:bg-accent-900/30',
    iconColor: 'text-accent-600 dark:text-accent-300',
  },
  neutral: {
    pill: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    icon: 'bg-neutral-100 dark:bg-neutral-800',
    iconColor: 'text-neutral-700 dark:text-neutral-200',
  },
  success: {
    pill: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-300',
  },
}

export interface PageIntroProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  tone?: PageTone
}

export function PageIntro({
  eyebrow,
  title,
  description,
  icon,
  actions,
  tone = 'primary',
  className,
  ...props
}: PageIntroProps) {
  const toneStyle = toneStyles[tone]

  return (
    <Card
      className={cn(
        'border-neutral-200/80 bg-white/90 dark:border-neutral-800/80 dark:bg-neutral-900/70',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          {eyebrow && (
            <div
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                toneStyle.pill,
              )}
            >
              {eyebrow}
            </div>
          )}

          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  toneStyle.icon,
                  toneStyle.iconColor,
                )}
              >
                {icon}
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {actions && <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div>}
      </div>
    </Card>
  )
}

export interface PageStatCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode
  label: string
  value: ReactNode
  helper?: string
  tone?: PageTone
}

export function PageStatCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary',
  className,
  ...props
}: PageStatCardProps) {
  const toneStyle = toneStyles[tone]

  return (
    <Card
      padding="sm"
      className={cn(
        'h-full border-neutral-200/80 bg-white/90 dark:border-neutral-800/80 dark:bg-neutral-900/70',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            toneStyle.icon,
            toneStyle.iconColor,
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
          {helper && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {helper}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeading({
  title,
  description,
  action,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  )
}
