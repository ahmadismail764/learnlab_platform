import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/utils/cn'
import { getTopicDisplayName } from '@/utils/topicLabels'
import type { ReviewForecastDay } from '@/services/practice'
import { useForecastDateFormatter } from './reviewForecast'

export interface ReviewAgendaProps {
  /** Days to render, each with the subtopics due. Assumed ascending by date. */
  days: ReviewForecastDay[]
  className?: string
}

/**
 * Renders an upcoming-review agenda: one row per day, each listing the
 * subtopics due (subtopic name + parent topic) as chips. Shared by the
 * Review Schedule page and the post-session completion summary.
 */
export function ReviewAgenda({ days, className }: ReviewAgendaProps) {
  const { t } = useTranslation(['learner', 'topics'])
  const formatDate = useForecastDateFormatter()

  return (
    <ol className={cn('space-y-3', className)}>
      {days.map((day) => {
        const { absolute, relative, diffDays } = formatDate(day.date)
        return (
          <li key={day.date} className="surface-tile">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {absolute}
                </span>
                <Badge variant={diffDays <= 0 ? 'warning' : 'outline'} size="sm">
                  {relative}
                </Badge>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('learner:topicDueCount', { count: day.due_count })}
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              {day.subtopics.map((subtopic) => (
                <li key={String(subtopic.id)}>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white px-2.5 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900/50">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">
                      {getTopicDisplayName(t, subtopic.name)}
                    </span>
                    {subtopic.topic_name && (
                      <span className="text-neutral-400 dark:text-neutral-500">
                        · {getTopicDisplayName(t, subtopic.topic_name)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
