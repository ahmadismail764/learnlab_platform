import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarClock, CheckCircle, CheckCircle2, Target } from 'lucide-react'
import { Button, Card, XpBadge } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { ReviewAgenda } from './ReviewAgenda'
import { useForecastDateFormatter } from './reviewForecast'
import type { ReviewForecast } from '@/services/practice'

interface PracticeCompleteProps {
  earnedXp: number
  questionCount: number
  nextReview: ReviewForecast | null
}

/** The post-session summary: XP earned and the upcoming-review agenda. */
export function PracticeComplete({ earnedXp, questionCount, nextReview }: PracticeCompleteProps) {
  const { t } = useTranslation(['practice', 'common'])
  const formatForecastDate = useForecastDateFormatter()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro
        eyebrow={t('practice:sessionCompleteEyebrow')}
        title={t('practice:niceWork')}
        description={t('practice:sessionCompleteDescription')}
        icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
        tone="success"
        actions={(
          <Link to="/learner/progress">
            <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
              {t('practice:viewProgress')}
            </Button>
          </Link>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PageStatCard
          icon={<XpBadge size="lg" variant="amber" />}
          label={t('practice:xpEarned')}
          value={`+${earnedXp}`}
          tone="accent"
        />
        <PageStatCard
          icon={<Target className="h-5 w-5" />}
          label={t('practice:questionsCompleted')}
          value={questionCount}
          tone="primary"
        />
        <PageStatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label={t('practice:sessionStatus')}
          value={t('common:saved')}
          helper={t('practice:reviewDataSynced')}
          tone="success"
        />
      </div>

      {nextReview && nextReview.forecast.length > 0 ? (
        <Card>
          <SectionHeading
            title={t('practice:upcomingReviewsTitle')}
            description={
              nextReview.next_review_at
                ? t('practice:comeBackHint', {
                    when: formatForecastDate(nextReview.next_review_at).relative.toLowerCase(),
                  })
                : t('practice:upcomingReviewsDescription')
            }
            action={(
              <Link to="/learner/schedule">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
                >
                  {t('practice:viewFullSchedule')}
                </Button>
              </Link>
            )}
          />
          <div className="mt-4">
            <ReviewAgenda days={nextReview.forecast.slice(0, 5)} />
          </div>
        </Card>
      ) : nextReview ? (
        <Card>
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {t('practice:noUpcomingReviewsTitle')}
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t('practice:noUpcomingReviewsDescription')}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('practice:keepMomentumGoing')}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t('practice:completionNextSteps')}
            </p>
          </div>
          <Link to="/learner">
            <Button variant="outline">{t('practice:backToDashboard')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
