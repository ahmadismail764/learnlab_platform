import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  ListChecks,
  Medal,
  Sparkles,
  TimerReset,
} from 'lucide-react'

import { Button, Card } from '@/components/ui'
import { PageIntro, SectionHeading } from '@/components/common'
import { useCurrentUser } from '@/contexts'
import { authService } from '@/services/auth'
import { markOnboardingComplete } from '@/utils/onboarding'
import { logger } from '@/utils/logger'

const LEARNLAB_POINTS = [
  {
    icon: BrainCircuit,
    titleKey: 'onboardingAdaptiveTitle',
    descriptionKey: 'onboardingAdaptiveDescription',
    tone: 'primary',
  },
  {
    icon: TimerReset,
    titleKey: 'onboardingReviewTitle',
    descriptionKey: 'onboardingReviewDescription',
    tone: 'secondary',
  },
  {
    icon: Gauge,
    titleKey: 'onboardingProgressTitle',
    descriptionKey: 'onboardingProgressDescription',
    tone: 'accent',
  },
] as const

const NEXT_ACTIONS = [
  {
    icon: ListChecks,
    titleKey: 'onboardingPracticeActionTitle',
    descriptionKey: 'onboardingPracticeActionDescription',
  },
  {
    icon: BarChart3,
    titleKey: 'onboardingProgressActionTitle',
    descriptionKey: 'onboardingProgressActionDescription',
  },
  {
    icon: Medal,
    titleKey: 'onboardingLeaderboardActionTitle',
    descriptionKey: 'onboardingLeaderboardActionDescription',
  },
] as const

const toneClassNames = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
} as const

export function OnboardingPage() {
  const { t } = useTranslation(['learner', 'common'])
  const navigate = useNavigate()
  const user = useCurrentUser()

  const finishOnboarding = (target: string) => {
    markOnboardingComplete(user.id)

    authService.updatePreferences({
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      onboardingVersion: 'intro-v1',
    }).catch((error) => {
      logger.warn('Failed to persist onboarding completion preference', error)
    })

    navigate(target, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t('learner:onboardingEyebrow')}
        title={t('learner:onboardingWelcomeTitle')}
        description={t('learner:onboardingWelcomeDescription')}
        icon={<Sparkles className="h-6 w-6" />}
        tone="primary"
        actions={(
          <>
            <Button variant="ghost" onClick={() => finishOnboarding('/learner')}>
              {t('learner:onboardingSkip')}
            </Button>
            <Button
              rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
              onClick={() => finishOnboarding('/learner/practice')}
            >
              {t('learner:onboardingStartPractice')}
            </Button>
          </>
        )}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {LEARNLAB_POINTS.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.titleKey} variant="panel-soft" className="h-full">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClassNames[item.tone]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                {t(`learner:${item.titleKey}`)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {t(`learner:${item.descriptionKey}`)}
              </p>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card variant="panel">
          <SectionHeading
            title={t('learner:onboardingWhatYouCanDoTitle')}
            description={t('learner:onboardingWhatYouCanDoDescription')}
          />

          <div className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
            {NEXT_ACTIONS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.titleKey} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      {t(`learner:${item.titleKey}`)}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                      {t(`learner:${item.descriptionKey}`)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card variant="panel-soft" className="flex flex-col justify-between gap-5">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-neutral-950 dark:text-neutral-50">
              {t('learner:onboardingReadyTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {t('learner:onboardingReadyDescription')}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              fullWidth
              rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
              onClick={() => finishOnboarding('/learner')}
            >
              {t('learner:onboardingOpenDashboard')}
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() => finishOnboarding('/learner/progress')}
            >
              {t('learner:viewProgress')}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}
