import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarCheck, CalendarClock, Clock } from 'lucide-react'
import { AllCaughtUpIllustration, Button, Card } from '@/components/ui'
import { Skeleton } from '@/components/ui/Loading'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { useReviewForecast } from '@/hooks'
import { cn } from '@/utils/cn'
import { ReviewAgenda } from './ReviewAgenda'
import { useForecastDateFormatter } from './reviewForecast'

/**
 * ReviewSchedulePage
 *
 * A learner agenda of upcoming FSRS reviews: which days have reviews and which
 * subtopics are due on each, over a selectable window (7 / 14 / 30 days).
 * Backed by GET /practice/review-forecast/?days=N.
 */

const WINDOW_OPTIONS = [7, 14, 30] as const

export function ReviewSchedulePage() {
  const { t } = useTranslation(['learner', 'common'])
  const [days, setDays] = useState<number>(7)
  const { data, isLoading, isError, isFetching } = useReviewForecast(days)
  const formatDate = useForecastDateFormatter()

  const forecast = useMemo(() => data?.forecast ?? [], [data])
  const dueNow = data?.due_now_count ?? 0
  const upcomingCount = useMemo(
    () => forecast.reduce((sum, day) => sum + day.due_count, 0),
    [forecast],
  )
  const nextReviewLabel = data?.next_review_at
    ? formatDate(data.next_review_at).relative
    : t('learner:notScheduled')

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t('learner:reviewScheduleEyebrow')}
        title={t('learner:reviewScheduleTitle')}
        description={t('learner:reviewScheduleDescription')}
        icon={<CalendarClock className="h-6 w-6" />}
        tone="primary"
        actions={(
          <Link to="/learner/practice">
            <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
              {t('learner:startSession')}
            </Button>
          </Link>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PageStatCard
          icon={<Clock className="h-5 w-5" />}
          label={t('learner:dueNow')}
          value={dueNow}
          helper={t('learner:topicsRevisitedFirst')}
          tone="accent"
        />
        <PageStatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label={t('learner:nextReviewIn')}
          value={nextReviewLabel}
          tone="primary"
        />
        <PageStatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label={t('learner:upcomingReviews')}
          value={upcomingCount}
          helper={t('learner:withinWindow', { count: days })}
          tone="secondary"
        />
      </div>

      <Card>
        <SectionHeading
          title={t('learner:reviewAgenda')}
          description={t('learner:reviewAgendaDescription')}
          action={(
            <div className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 p-1 dark:bg-neutral-800/60">
              {WINDOW_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  aria-pressed={days === option}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
                    days === option
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
                  )}
                >
                  {t('learner:daysShort', { count: option })}
                </button>
              ))}
            </div>
          )}
        />

        <div className={cn('mt-5 transition-opacity duration-200', isFetching && !isLoading && 'opacity-60')}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="surface-tile">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton width="40%" />
                    <Skeleton width={70} height={20} className="rounded-full" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Skeleton width={90} height={24} className="rounded-lg" />
                    <Skeleton width={120} height={24} className="rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="surface-inset border border-dashed border-neutral-200/80 px-6 py-10 text-center dark:border-neutral-800">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('learner:reviewScheduleError')}
              </p>
            </div>
          ) : forecast.length === 0 ? (
            <div className="surface-inset border border-dashed border-neutral-200/80 px-6 py-10 text-center dark:border-neutral-800">
              <AllCaughtUpIllustration className="mx-auto" />
              <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('learner:allCaughtUp')}
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {t('learner:noUpcomingReviewsDescription', { count: days })}
              </p>
            </div>
          ) : (
            <ReviewAgenda days={forecast} />
          )}
        </div>
      </Card>
    </div>
  )
}
