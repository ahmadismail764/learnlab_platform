import { useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { getIntegrationStatus } from '@/constants/integrationStatus'

interface IntegrationStatusBadgeProps {
  compact?: boolean
}

export function IntegrationStatusBadge({ compact = false }: IntegrationStatusBadgeProps) {
  const location = useLocation()
  const { status, label, detail } = getIntegrationStatus(location.pathname)

  const toneClass =
    status === 'backend'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : status === 'partial'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        toneClass
      )}
      title={detail}
      aria-label={`Integration status: ${label}`}
    >
      {compact ? label : `Data Source: ${label}`}
    </div>
  )
}
