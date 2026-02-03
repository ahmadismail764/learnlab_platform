import { type ReactNode } from 'react'
import { FileQuestion, Inbox, Search, Users, BookOpen } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

/**
 * EmptyState Component
 * 
 * Display meaningful empty states with icons and actions.
 */

type EmptyStatePreset = 'default' | 'search' | 'students' | 'content' | 'noResults'

interface EmptyStateProps {
  /** Preset type for common empty states */
  preset?: EmptyStatePreset
  /** Custom icon */
  icon?: ReactNode
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Secondary action */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Additional CSS classes */
  className?: string
}

const presets: Record<EmptyStatePreset, { icon: typeof Inbox; title: string; description: string }> = {
  default: {
    icon: Inbox,
    title: 'No items yet',
    description: 'Get started by creating your first item.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  students: {
    icon: Users,
    title: 'No students yet',
    description: 'Students will appear here once they join your class.',
  },
  content: {
    icon: BookOpen,
    title: 'No content available',
    description: 'Check back later for new learning materials.',
  },
  noResults: {
    icon: FileQuestion,
    title: 'Nothing here',
    description: 'This section is empty right now.',
  },
}

export function EmptyState({
  preset = 'default',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const config = presets[preset]
  const Icon = icon ? null : config.icon
  const displayTitle = title ?? config.title
  const displayDescription = description ?? config.description

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {/* Icon */}
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        {icon ?? (Icon && <Icon className="w-8 h-8 text-neutral-400" />)}
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">
        {displayTitle}
      </h3>
      <p className="text-neutral-500 max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
