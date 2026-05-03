import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  BookOpen,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, Avatar } from '@/components/ui'
import { Skeleton } from '@/components/ui/Loading'
import { useCurrentUser } from '@/contexts'
import { analyticsService, type AggregatedMetricsResponse } from '@/services/analytics'
import { learnersService, type LearnerProfile } from '@/services/learners'

/**
 * AdminDashboard
 * 
 * System overview for administrators with branded visual identity.
 * Backend-integrated:
 * - Overview stats from /api/v1/analytics/aggregated/
 * - Leaderboard/user list from /api/v1/auth/leaderboard/global/
 */

export function AdminDashboard() {
  const { t } = useTranslation(['admin', 'common', 'auth', 'time'])
  const user = useCurrentUser()

  const [metrics, setMetrics] = useState<AggregatedMetricsResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<LearnerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [metricsRes, leaderboardRes] = await Promise.allSettled([
          analyticsService.getAggregatedMetrics(),
          learnersService.getLeaderboard(),
        ])

        if (!isMounted) return

        if (metricsRes.status === 'fulfilled') {
          setMetrics(metricsRes.value)
        }
        if (leaderboardRes.status === 'fulfilled') {
          setLeaderboard(leaderboardRes.value)
        }

        // If both failed, show error
        if (metricsRes.status === 'rejected' && leaderboardRes.status === 'rejected') {
          setError('Could not load dashboard data. Showing fallback values.')
        }
      } catch {
        if (isMounted) setError('Failed to fetch dashboard data.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [])

  // Derive stats from real data with fallbacks
  const stats = useMemo(() => ({
    totalLearners: leaderboard.length || 0,
    activeThisWeek: metrics?.active_users['7_days'] ?? 0,
    totalReviews: metrics?.review_count ?? 0,
    avgRetention: metrics?.estimated_retention
      ? Math.round(metrics.estimated_retention * 100)
      : 0,
  }), [metrics, leaderboard])

  // Top learners for the "recent users" section
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

  const systemHealth = [
    { nameKey: 'admin:apiResponseTime', value: metrics ? '< 200ms' : '--', status: metrics ? 'good' : 'warning' },
    { nameKey: 'admin:database', value: '99.9%', status: 'good' },
    { nameKey: 'admin:storage', value: '67%', status: 'warning' },
    { nameKey: 'admin:activeSessions', value: String(stats.activeThisWeek), status: stats.activeThisWeek > 0 ? 'good' : 'warning' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero — branded gradient with admin context */}
      <Card className="relative overflow-hidden bg-linear-to-br from-secondary-600 via-secondary-500 to-primary-600 text-white border-0">
        {/* Decorative graph nodes */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <circle cx="480" cy="30" r="5" fill="white" />
            <circle cx="530" cy="70" r="4" fill="white" />
            <circle cx="440" cy="90" r="6" fill="white" />
            <circle cx="510" cy="130" r="5" fill="white" />
            <line x1="480" y1="30" x2="530" y2="70" stroke="white" strokeWidth="1.5" />
            <line x1="530" y1="70" x2="510" y2="130" stroke="white" strokeWidth="1.5" />
            <line x1="440" y1="90" x2="510" y2="130" stroke="white" strokeWidth="1.5" />
            <line x1="480" y1="30" x2="440" y2="90" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-accent-300" />
            <p className="text-white/70 text-sm">{t('admin:adminDashboard')}</p>
          </div>
          <h1 className="text-2xl font-bold font-display">
            {t('admin:welcomeBackAdmin', { name: user.firstName })}
          </h1>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{error}</p>
        </div>
      )}

      {/* Stats Grid — branded */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalLearners}</p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:totalLearners')}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.activeThisWeek}</p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:activeThisWeek')}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-100 dark:bg-accent-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalReviews.toLocaleString()}</p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:totalReviews', 'Total reviews')}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-secondary-700 dark:text-secondary-300" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.avgRetention}%</p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:retention', 'Retention')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Learners */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={t('admin:topLearners')}
              action={<Button variant="ghost" size="sm">{t('common:viewAll')}</Button>}
            />
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <Skeleton variant="circular" width={36} height={36} />
                      <div className="flex-1 space-y-2">
                        <Skeleton width="50%" />
                        <Skeleton width="30%" height={12} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topLearners.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6">
                  No learner data available yet.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {topLearners.map((u, index) => (
                    <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-neutral-800 dark:text-neutral-100">{u.name}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={index < 3 ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {u.xp.toLocaleString()} XP
                        </Badge>
                        <span className="text-sm text-neutral-400">
                          🔥 {u.streak}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <Card>
            <CardHeader title={t('admin:systemHealth')} />
            <CardContent>
              <div className="space-y-3">
                {systemHealth.map((item) => (
                  <div key={item.nameKey} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t(item.nameKey)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.value}</span>
                      <Badge
                        dot
                        variant={item.status === 'good' ? 'success' : 'warning'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
