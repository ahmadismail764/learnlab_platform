import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock, Target, TestTube2 } from 'lucide-react'
import { Button, Card, XpBadge } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'

interface PracticeIntroProps {
  onStart: () => void
  isLoading: boolean
}

/** The "ready to start" screen shown before a practice session begins. */
export function PracticeIntro({ onStart, isLoading }: PracticeIntroProps) {
  const { t } = useTranslation(['practice'])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro
        eyebrow={t('practice:practiceSessionEyebrow')}
        title={t('practice:readyForFocusedReview')}
        description={t('practice:practiceIntroDescription')}
        icon={<TestTube2 className="h-6 w-6" />}
        tone="primary"
        actions={(
          <Button
            onClick={onStart}
            isLoading={isLoading}
            rightIcon={!isLoading ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : undefined}
          >
            {t('practice:startSession')}
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PageStatCard
          icon={<Target className="h-5 w-5" />}
          label={t('practice:questionSet')}
          value={t('practice:upToTen')}
          helper={t('practice:adaptiveReviewMix')}
          tone="primary"
        />
        <PageStatCard
          icon={<Clock className="h-5 w-5" />}
          label={t('practice:estimatedTime')}
          value={t('practice:tenToFifteenMinutes')}
          helper={t('practice:choiceBasedReview')}
          tone="secondary"
        />
        <PageStatCard
          icon={<XpBadge size="lg" variant="amber" />}
          label={t('practice:reward')}
          value={t('practice:tierXp')}
          helper={t('practice:harderItemsReward')}
          tone="accent"
        />
      </div>

      <Card>
        <SectionHeading
          title={t('practice:howSessionWorks')}
          description={t('practice:howSessionWorksDescription')}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="surface-inset">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('practice:solveStep')}
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('practice:solveDescription')}
            </p>
          </div>
          <div className="surface-inset">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('practice:reflectStep')}
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('practice:reflectDescription')}
            </p>
          </div>
          <div className="surface-inset">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('practice:keepMomentumStep')}
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('practice:keepMomentumDescription')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
