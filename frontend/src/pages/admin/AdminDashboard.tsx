import { useMemo } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Button, Badge, Avatar, EmptyState, EmptyDataIllustration } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { Skeleton } from '@/components/ui/Loading'
import { useCurrentUser } from '@/contexts'
import { useAggregatedMetrics, useGlobalLeaderboard } from '@/hooks'
import type { LearnerProfile } from '@/services/learners'

export function AdminDashboard() {
  const { t } = useTranslation(['admin', 'common', 'auth', 'time'])
  const user = useCurrentUser()

  const { data: metrics, isLoading: metricsLoading } = useAggregatedMetrics()
  const { data: leaderboardRaw, isLoading: lbLoading } = useGlobalLeaderboard()
  const leaderboard = useMemo(
    () => (leaderboardRaw ?? []) as LearnerProfile[],
    [leaderboardRaw]
  )
  const isLoading = metricsLoading || lbLoading

  const stats = useMemo(() => ({
    totalLearners: leaderboard.length || 0,
    activeThisWeek: metrics?.active_users['7_days'] ?? 0,
    totalReviews: metrics?.review_count ?? 0,
    avgRetention: metrics?.estimated_retention
      ? Math.round(metrics.estimated_retention * 100)
      : 0,
  }), [metrics, leaderboard])

  const topLearners = useMemo(() =>
    leaderboard.slice(0, 5).map((entry) => ({
      id: String(entry.id),
      name: `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.username,
      email: entry.user.email,
      xp: entry.total_xp,
      streak: entry.streak_count,
    })),
    [leaderboard]
  )



  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <PageIntro
          eyebrow={t('admin:adminDashboard')}
          title={t('admin:welcomeBackAdmin', { name: user.firstName })}
          description="Keep an eye on learner activity, review volume, and system health without digging through noisy dashboards."
          icon={<BarChart3 className="h-6 w-6" />}
          tone="secondary"
        />

        <Card className="dashboard-panel">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
            System snapshot
          </p>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton width="58%" height={34} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="100%" height={14} />
            </div>
          ) : (
            <>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {stats.activeThisWeek} active this week
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                Learner activity is the quickest signal for whether content and review flow are staying healthy.
              </p>

              <div className="mt-5 space-y-3 border-t border-neutral-200/80 pt-4 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Reviews logged</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {stats.totalReviews.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Retention estimate</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {stats.avgRetention}%
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <PageStatCard
          icon={<Users className="h-5 w-5" />}
          label={t('admin:totalLearners')}
          value={isLoading ? '--' : stats.totalLearners}
          helper="Tracked accounts"
          tone="secondary"
        />
        <PageStatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('admin:activeThisWeek')}
          value={isLoading ? '--' : stats.activeThisWeek}
          helper="Learners with recent activity"
          tone="success"
        />
        <PageStatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={t('admin:totalReviews', 'Total reviews')}
          value={isLoading ? '--' : stats.totalReviews.toLocaleString()}
          helper="All recorded review events"
          tone="primary"
        />
        <PageStatCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t('admin:retention', 'Retention')}
          value={isLoading ? '--' : `${stats.avgRetention}%`}
          helper="Estimated recall health"
          tone="accent"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="dashboard-panel">
          <SectionHeading
            title={t('admin:topLearners')}
            description="A quick read on who is consistently converting practice into progress."
            action={
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4 rtl:rotate-180" />}>
                {t('common:viewAll')}
              </Button>
            }
          />

          <div className="mt-5">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0 dark:border-neutral-800"
                  >
                    <Skeleton variant="circular" width={36} height={36} />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="45%" />
                      <Skeleton width="30%" height={12} />
                    </div>
                  </div>
                ))}
              </div>
            ) : topLearners.length === 0 ? (
              <EmptyState
                illustration={<EmptyDataIllustration className="mx-auto" />}
                title={t('admin:noLearnerData', 'No learner data available yet')}
                description="Once learners start practicing and gaining XP, they will appear in this leaderboard."
                className="py-6 surface-inset border border-dashed border-neutral-200/80 dark:border-neutral-800"
              />
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {topLearners.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-sm font-semibold text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300">
                        {index + 1}
                      </div>
                      <Avatar name={entry.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                          {entry.name}
                        </p>
                        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                          {entry.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {entry.xp.toLocaleString()} XP
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {entry.streak} day streak
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">


          <Card className="dashboard-panel-soft border-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Admin note
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              If active users stay healthy while retention drops, the problem is usually content quality or review pacing, not acquisition.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}
