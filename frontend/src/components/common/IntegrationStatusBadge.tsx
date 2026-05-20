import { useLocation } from 'react-router-dom'
import { getIntegrationStatus, type IntegrationStatus } from '@/constants/integrationStatus'
import { cn } from '@/utils/cn'

interface IntegrationStatusBadgeProps {
  compact?: boolean
}

const statusStyles: Record<IntegrationStatus, string> = {
  backend: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300',
  partial: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  static: 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
}

export function IntegrationStatusBadge({ compact = false }: IntegrationStatusBadgeProps) {
  const location = useLocation()
  const info = getIntegrationStatus(location.pathname)

  return (
    <span
      title={info.detail}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        statusStyles[info.status],
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {compact ? info.label : `${info.label}: ${info.detail}`}
    </span>
  )
}
