import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  ArrowRight,
  Brain,
  Clock,
  History,
  Target,
  TrendingUp,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import { Card, Badge, Button, ProgressBar, ProgressRing, EmptyDataIllustration, XpBadge } from '@/components/ui'
import { PageStatCard, SectionHeading } from '@/components/common'
import { Skeleton } from '@/components/ui/Loading'
import { useLearnerProfile, useTopicMastery } from '@/hooks'
import { MASTERY_STATUS_BADGE_VARIANT, type TopicMastery } from '@/constants/mastery'
import { getTopicDisplayName } from '@/utils/topicLabels'

/**
 * ProgressPage
 *
 * Backend-integrated progress view:
 * - Stats derived from learner profile (XP, streak) and topic mastery
 * - Topic breakdown cards with FSRS retrievability/stability metrics
 * - Review goal progress
 * RTL-aware with full i18n support.
 */

export function ProgressPage() {
  const { t } = useTranslation(['learner', 'topics'])
  const [renderTimestamp] = useState(() => Date.now())
  const { data: profile, isLoading: profileLoading } = useLearnerProfile()
  const { data: rawMasteries, isLoading: masteryLoading } = useTopicMastery()
  const masteries = useMemo(
    () => (rawMasteries ?? []) as TopicMastery[],
    [rawMasteries]
  )
  const isLoading = profileLoading || masteryLoading

  // Derive weekly-style stats from real data
  const weeklyStats = useMemo(() => {
    const topicsReviewed = masteries.filter((m) => m.last_reviewed).length
    const avgMemory =
      masteries.length > 0
        ? Math.round(
            (masteries.reduce((s, m) => s + Math.min(1, m.memory || 0), 0) /
              masteries.length) *
              100
          )
        : 0

    return {
      xpEarned: profile?.total_xp ?? 0,
      streak: profile?.streak_count ?? 0,
      topicsReviewed,
      averageAccuracy: avgMemory,
      totalTopics: masteries.length,
    }
  }, [profile, masteries])

  // Overall mastery percentage
  const overallMastery = useMemo(() => {
    if (masteries.length === 0) return 0
    return Math.round(
      (masteries.reduce((s, m) => s + Math.min(1, m.memory || 0), 0) /
        masteries.length) *
        100
    )
  }, [masteries])

  const dueNowCount = useMemo(
    () =>
      masteries.filter(
        (mastery) => mastery.next_due && new Date(mastery.next_due) <= new Date()
      ).length,
    [masteries]
  )

  const strongTopics = useMemo(
    () =>
      masteries.filter(
        (mastery) =>
          mastery.status === 'learned' || Math.min(1, mastery.memory || 0) >= 0.75
      ).length,
    [masteries]
  )

  const needsAttention = useMemo(
    () =>
      masteries.filter(
        (mastery) =>
          mastery.status === 'struggling' || Math.min(1, mastery.memory || 0) < 0.35
      ).length,
    [masteries]
  )

  const averageSpeed = useMemo(() => {
    if (masteries.length === 0) return 0
    return (
      masteries.reduce((sum, mastery) => sum + Number(mastery.speed || 0), 0) /
      masteries.length
    )
  }, [masteries])

  const statusLabel = (status: TopicMastery['status']) => {
    const labels: Record<TopicMastery['status'], string> = {
      new: t('stateNew'),
      learning: t('stateLearning'),
      learned: t('stateMastered'),
      struggling: t('stateStruggling'),
    }
    return labels[status]
  }

  const formatStabilityDays = (days: number) =>
    t('daysShort', { count: Number(days.toFixed(1)) })

  // Topic cards sorted by status priority: struggling → learning → new → learned
  const topicCards = useMemo(() => {
    const priority: Record<string, number> = {
      struggling: 0,
      learning: 1,
      new: 2,
      learned: 3,
    }
    return [...masteries].sort(
      (a, b) => (priority[a.status] ?? 2) - (priority[b.status] ?? 2)
    )
  }, [masteries])

  const overviewStats = [
    {
      icon: <Target className="h-5 w-5" />,
      label: t('topicsTracked'),
      value: weeklyStats.totalTopics,
      helper: t('topicsReviewedCount', { count: weeklyStats.topicsReviewed }),
      tone: 'primary' as const,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: t('dueNow'),
      value: dueNowCount,
      helper: t('topicsRevisitedFirst'),
      tone: 'accent' as const,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: t('strongRecall'),
      value: strongTopics,
      helper: t('strongRecallHelper'),
      tone: 'success' as const,
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: t('practiceStreak'),
      value: t('streakDaysValue', { count: weeklyStats.streak }),
      helper: t('practiceStreakHelper'),
      tone: 'secondary' as const,
    },
    {
      icon: <XpBadge size="lg" />,
      label: t('totalXP'),
      value: weeklyStats.xpEarned.toLocaleString(),
      helper: t('overallExperiencePoints'),
      tone: 'accent' as const,
    },
  ]

  // Format next_due as relative text
  const formatDue = (nextDue: string | null): string => {
    if (!nextDue) return t('notScheduled')
    const diff = new Date(nextDue).getTime() - renderTimestamp
    if (diff <= 0) return t('dueNow')
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days === 1) return t('tomorrow')
    return t('inDays', { count: days })
  }

  return (
    <div className="space-y-6">
      <Card className="learner-panel relative overflow-hidden border-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_18%_26%,rgba(20,184,166,0.14),transparent_26%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_18%_26%,rgba(20,184,166,0.16),transparent_26%)]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.92fr)]">
          <div className="space-y-4">
            <Badge variant="secondary" size="sm">
              {t('learningAnalytics')}
            </Badge>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-[2.4rem]">
                {t('progressNextActionTitle')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
                {t('progressSpacedRepetitionDescription')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" size="sm">
                {t('topicsTracked')}: {weeklyStats.totalTopics}
              </Badge>
              <Badge variant={dueNowCount > 0 ? 'warning' : 'success'} size="sm">
                {dueNowCount > 0 ? t('topicDueCount', { count: dueNowCount }) : t('queueUnderControl')}
              </Badge>
              <Badge variant="primary" size="sm">
                {weeklyStats.averageAccuracy}% {t('memoryLabel')}
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/90 p-5 text-neutral-950 shadow-[0_18px_32px_-26px_rgba(15,23,42,0.22)] dark:border-neutral-700 dark:bg-neutral-900/72 dark:text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-white/60">
              {t('retentionIndex')}
            </p>

            {isLoading ? (
              <div className="mt-4 flex items-center gap-4">
                <Skeleton variant="circular" width={88} height={88} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="70%" />
                  <Skeleton width="100%" height={12} />
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-4">
                <ProgressRing
                  value={overallMastery}
                  size={88}
                  variant={
                    overallMastery >= 70
                      ? 'success'
                      : overallMastery >= 40
                        ? 'secondary'
                        : 'accent'
                  }
                />
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {overallMastery}%
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-white/70">
                    {overallMastery >= 70
                      ? t('strongRecallCourse')
                      : overallMastery >= 40
                        ? t('goodRetentionShape')
                        : t('earlyRetentionStage')}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5">
              <Link to="/learner/practice">
                <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
                  {t('startSession')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="learner-panel-soft border-0" padding="sm">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="50%" />
                    <Skeleton width="70%" height={12} />
                  </div>
                </div>
              </Card>
            ))
          : overviewStats.map((item) => (
              <PageStatCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                helper={item.helper}
                tone={item.tone}
                className="learner-panel-soft border-0"
              />
            ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <Card className="learner-panel">
          <SectionHeading
            title={t('masteryOverview')}
            description={t('masteryOverviewDescription')}
          />

          <div className="mt-5 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="surface-tile"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton width="40%" />
                      <Skeleton width={70} height={24} className="rounded-full" />
                    </div>
                    <Skeleton width="55%" height={12} />
                    <Skeleton height={8} />
                  </div>
                </div>
              ))
            ) : topicCards.length === 0 ? (
              <div className="surface-inset border border-dashed border-neutral-200/80 dark:border-neutral-800 px-6 py-10 text-center">
                <EmptyDataIllustration className="mx-auto" />
                <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('noMasteryYet')}
                </p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {t('noMasteryDescription')}
                </p>
              </div>
            ) : (
              topicCards.slice(0, 8).map((topic) => {
                const progress = Math.round(Math.min(1, topic.memory || 0) * 100)
                return (
                  <div
                    key={topic.id}
                    className="surface-tile"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                          {getTopicDisplayName(t, topic.subtopic_name)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {t('reviewCount', { count: topic.rep_num })} • {formatDue(topic.next_due)}
                        </p>
                      </div>
                      <Badge variant={MASTERY_STATUS_BADGE_VARIANT[topic.status] ?? 'outline'} size="sm">
                        {statusLabel(topic.status)} • {progress}%
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <ProgressBar
                        value={progress}
                        variant="secondary"
                        indicatorClassName="bg-linear-to-r from-secondary-500 to-primary-500"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="learner-panel">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary-600 dark:text-secondary-300" />
              <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {t('spacedRepetitionSignals')}
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <div className="surface-tile">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('strongTopics')}
                  </span>
                  <span className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    {strongTopics}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('strongTopicsHelper')}
                </p>
              </div>

              <div className="surface-tile">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('needsAttention')}
                  </span>
                  <span className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    {needsAttention}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('weakTopicsHelper')}
                </p>
              </div>

              <div className="surface-tile">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('speed')}
                  </span>
                  <span className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    {formatStabilityDays(averageSpeed)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('approximateSpacedRepetitionPace')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="learner-panel-soft border-0">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-neutral-500" />
              <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {t('whatToDoWithThis')}
              </h2>
            </div>

            <div className="surface-inset mt-4 border border-dashed border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-start gap-3">
                {dueNowCount > 0 ? (
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                ) : (
                  <Brain className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {t('queueAdviceTitle')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    {dueNowCount > 0
                      ? t('queueAdviceDue')
                      : t('queueControlledAdvice')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Link to="/learner/topics">
                <Button fullWidth variant="outline">
                  {t('reviewTopics')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title={t('topicBreakdown')}
          description={t('topicBreakdownDescription')}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="learner-panel-soft border-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="60%" />
                      <Skeleton width="40%" height={12} />
                    </div>
                  </div>
                  <Skeleton height={8} />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton height={56} variant="rectangular" className="rounded-xl" />
                    <Skeleton height={56} variant="rectangular" className="rounded-xl" />
                    <Skeleton height={56} variant="rectangular" className="rounded-xl" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : topicCards.length === 0 ? (
          <Card className="learner-panel border-0">
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('completePracticeForBreakdown')}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {topicCards.map((topic) => {
              const progress = Math.round(Math.min(1, topic.memory || 0) * 100)
              return (
                <Card key={topic.id} className="learner-panel-soft h-full border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-sm font-semibold text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300">
                        <Brain className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                          {getTopicDisplayName(t, topic.subtopic_name)}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('reviewCount', { count: topic.rep_num })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={MASTERY_STATUS_BADGE_VARIANT[topic.status] ?? 'outline'} size="sm">
                      {statusLabel(topic.status)}
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">{t('mastery')}</span>
                      <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar
                      value={progress}
                      variant="secondary"
                      indicatorClassName="bg-linear-to-r from-secondary-500 to-primary-500"
                    />
                  </div>

                  <div className="surface-tile mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
                        {t('memoryLabel')}
                      </p>
                      <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                        {progress}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
                        {t('speed')}
                      </p>
                      <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                        {formatStabilityDays(topic.speed || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
                        {t('nextReview')}
                      </p>
                      <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                        {formatDue(topic.next_due)}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
