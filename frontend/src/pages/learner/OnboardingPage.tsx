import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Gauge,
  ListChecks,
  Medal,
  Sparkles,
  TimerReset,
} from 'lucide-react'

import { Button, Card } from '@/components/ui'
import { PageIntro, SectionHeading } from '@/components/common'
import { useCurrentUser, useToast } from '@/contexts'
import { authService } from '@/services/auth'
import { markOnboardingComplete } from '@/utils/onboarding'
import { logger } from '@/utils/logger'
import { useSubtopics, useEnrollMany } from '@/hooks'
import { OnboardingTopicPicker } from './OnboardingTopicPicker'

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

/**
 * Two-step first-run flow: a short tour, then a topic picker. Picking topics is
 * the functional heart — a learner is enrolled in nothing by default, and the
 * app (questions, sessions) is empty until they enroll.
 */
export function OnboardingPage() {
  const { t } = useTranslation(['learner', 'common'])
  const navigate = useNavigate()
  const user = useCurrentUser()
  const { showError } = useToast()

  const [step, setStep] = useState<'intro' | 'topics'>('intro')

  const { data: rawSubtopics } = useSubtopics()
  const subtopics = useMemo(() => rawSubtopics ?? [], [rawSubtopics])
  const enrollMany = useEnrollMany()

  // Recommended default: the first topic in each category — a balanced starter
  // plan the learner can accept in one click (or adjust).
  const recommendedIds = useMemo(() => {
    const seenCategories = new Set<string>()
    const ids: string[] = []
    for (const subtopic of subtopics) {
      const category = subtopic.topic_name || 'Uncategorized'
      if (!seenCategories.has(category)) {
        seenCategories.add(category)
        ids.push(String(subtopic.id))
      }
    }
    return ids
  }, [subtopics])

  const finishOnboarding = (target: string) => {
    markOnboardingComplete(user.id)
    authService
      .updatePreferences({
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        onboardingVersion: 'topics-v1',
      })
      .catch((error) => logger.warn('Failed to persist onboarding completion preference', error))
    navigate(target, { replace: true })
  }

  const handleSubmitTopics = (ids: string[]) => {
    enrollMany.mutate(ids, {
      onSuccess: () => finishOnboarding('/learner'),
      onError: (err) => showError(err instanceof Error ? err.message : t('learner:enrollFailed')),
    })
  }

  if (step === 'topics') {
    return (
      <div className="mx-auto max-w-3xl">
        <OnboardingTopicPicker
          subtopics={subtopics}
          defaultSelected={recommendedIds}
          onSubmit={handleSubmitTopics}
          onBack={() => setStep('intro')}
          onSkip={() => finishOnboarding('/learner/topics')}
          isSubmitting={enrollMany.isPending}
        />
      </div>
    )
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
          <Button
            onClick={() => setStep('topics')}
            rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          >
            {t('learner:onboardingContinue')}
          </Button>
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
    </div>
  )
}
