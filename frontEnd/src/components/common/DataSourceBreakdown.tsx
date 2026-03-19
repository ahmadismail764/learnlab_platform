import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { getDataSourceBreakdown, type DataSourceType } from '@/constants/dataSourceBreakdown'

interface DataSourceBreakdownProps {
  compact?: boolean
  defaultOpen?: boolean
}

function sourcePillClass(source: DataSourceType): string {
  if (source === 'backend') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }
  if (source === 'partial') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
  return 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
}

function sourceLabel(source: DataSourceType): string {
  if (source === 'backend') return 'Backend'
  if (source === 'partial') return 'Partial'
  return 'Static'
}

export function DataSourceBreakdown({ compact = false, defaultOpen = false }: DataSourceBreakdownProps) {
  const location = useLocation()
  const items = useMemo(() => getDataSourceBreakdown(location.pathname), [location.pathname])
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={cn('rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Data Source Breakdown</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Flags what is static vs backend-integrated on this route.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-2.5 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-label={open ? 'Hide data source details' : 'Show data source details'}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.aspect} className="rounded-lg border border-neutral-100 dark:border-neutral-800 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-800 dark:text-neutral-100">{item.aspect}</p>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium', sourcePillClass(item.source))}>
                  {sourceLabel(item.source)}
                </span>
              </div>
              {item.note && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{item.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
