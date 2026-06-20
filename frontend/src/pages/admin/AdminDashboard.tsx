import { useMemo } from 'react'
import {
  Activity,
  BarChart3,
  Brain,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Badge, Avatar, EmptyState, EmptyDataIllustration } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { Skeleton } from '@/components/ui/Loading'
import { useCurrentUser } from '@/contexts'
import { useAggregatedMetrics, useGlobalLeaderboard, useSystemHealth } from '@/hooks'
import type { LearnerProfile } from '@/services/learners'

function formatPercent(value: number | null | undefined) {
  return typeof value === 'number' ? `${Math.round(value)}%` : '--'
}

function formatLatency(value: number | null | undefined) {
  return typeof value === 'number' ? `${Math.round(value)} ms` : '--'
}

function formatUptime(seconds: number | null | undefined) {
  if (typeof seconds !== 'number') return '--'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

export function AdminDashboard() {
  const { t } = useTranslation(['admin', 'common', 'auth'])
  const user = useCurrentUser()

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useAggregatedMetrics()
  const { data: leaderboardRaw, isLoading: lbLoading, error: leaderboardError } = useGlobalLeaderboard()
  const { data: systemHealth, isLoading: healthLoading, error: healthError } = useSystemHealth()
  const leaderboard = useMemo(
    () => (leaderboardRaw ?? []) as LearnerProfile[],
    [leaderboardRaw]
  )
  const analyticsErrorMessage = metricsError instanceof Error ? metricsError.message : ''
  const leaderboardErrorMessage = leaderboardError instanceof Error ? leaderboardError.message : ''
  const healthErrorMessage = healthError instanceof Error ? healthError.message : ''

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
          description={t('admin:welcomeBackAdminDescription')}
          icon={<BarChart3 className="h-6 w-6" />}
          tone="secondary"
        />

        <Card className="dashboard-panel">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
            {t('admin:systemSnapshot')}
          </p>

          {healthLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton width="58%" height={34} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="100%" height={14} />
            </div>
          ) : healthErrorMessage ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
              {healthErrorMessage}
            </p>
          ) : (
            <>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {systemHealth?.database.status === 'ok'
                  ? t('admin:databaseOnline')
                  : t('admin:databaseIssue')}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {t('admin:systemUptime', { uptime: formatUptime(systemHealth?.uptime_seconds) })}
              </p>

              <div className="mt-5 space-y-3 border-t border-neutral-200/80 pt-4 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('admin:memoryUsage')}</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {formatPercent(systemHealth?.memory.percent)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('admin:diskUsage')}</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {formatPercent(systemHealth?.disk.percent)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('admin:apiLatency')}</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {formatLatency(systemHealth?.avg_api_latency_ms ?? systemHealth?.database.latency_ms)}
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </section>

      {(analyticsErrorMessage || leaderboardErrorMessage || healthErrorMessage) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
          {analyticsErrorMessage || leaderboardErrorMessage || healthErrorMessage}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <PageStatCard
          icon={<Users className="h-5 w-5" />}
          label={t('admin:totalLearners')}
          value={lbLoading || leaderboardErrorMessage ? '--' : stats.totalLearners}
          helper={t('admin:totalLearnersHelper')}
          tone="secondary"
        />
        <PageStatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('admin:activeThisWeek')}
          value={metricsLoading || analyticsErrorMessage ? '--' : stats.activeThisWeek}
          helper={t('admin:activeThisWeekHelper')}
          tone="success"
        />
        <PageStatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={t('admin:totalReviews')}
          value={metricsLoading || analyticsErrorMessage ? '--' : stats.totalReviews.toLocaleString()}
          helper={t('admin:totalReviewsHelper')}
          tone="primary"
        />
        <PageStatCard
          icon={<Brain className="h-5 w-5" />}
          label={t('admin:retention')}
          value={metricsLoading || analyticsErrorMessage ? '--' : `${stats.avgRetention}%`}
          helper={t('admin:retentionHealthHelper')}
          tone="accent"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="dashboard-panel">
          <SectionHeading
            title={t('admin:topLearners')}
            description={t('admin:topLearnersDescription')}
          />

          <div className="mt-5">
            {lbLoading ? (
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
            ) : leaderboardErrorMessage ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                {leaderboardErrorMessage}
              </div>
            ) : topLearners.length === 0 ? (
              <EmptyState
                illustration={<EmptyDataIllustration className="mx-auto" />}
                title={t('admin:noLearnerData')}
                description={t('admin:noLearnerDataDescription')}
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
                          {t('admin:experiencePointsValue', { value: entry.xp.toLocaleString() })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">
                        {t('admin:dayStreak', { count: entry.streak })}
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
              {t('admin:adminNote')}
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {t('admin:adminNoteDescription')}
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}
