import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  TrendingUp,
  Target,
  BookOpen,
  BarChart3,
  Activity,
  Search,
  AlertTriangle,
  Flame,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Badge, Input } from '@/components/ui'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { PageIntro, PageStatCard } from '@/components/common'
import {
  useAggregatedMetrics,
  useGlobalLeaderboard,
  useBulkTopicAnalytics,
  useActivityTimeSeries,
  useDifficultyBreakdown,
} from '@/hooks'

/**
 * AnalyticsPage - Admin Learner Analytics Dashboard
 * 
 * Features:
 * - Aggregate learner metrics
 * - Topic performance overview
 * - Activity trends
 */



export function AnalyticsPage() {
  const { t } = useTranslation(['admin', 'common', 'topics'])

  const [topicSearch, setTopicSearch] = useState('')

  const { data: aggregated, isLoading: metricsLoading, error: metricsError } = useAggregatedMetrics()
  const { data: leaderboard, isLoading: lbLoading, error: leaderboardError } = useGlobalLeaderboard()
  const { data: bulkAnalytics, isLoading: bulkLoading, error: bulkError } = useBulkTopicAnalytics()
  const { data: activityData, isLoading: activityLoading, error: activityError } = useActivityTimeSeries()
  const { data: difficultyData, isLoading: difficultyLoading, error: difficultyError } = useDifficultyBreakdown()

  const isLoadingOverview = metricsLoading || lbLoading || bulkLoading || activityLoading || difficultyLoading
  const contractErrors = [metricsError, leaderboardError, bulkError, activityError, difficultyError]
    .filter((error): error is Error => error instanceof Error)
  const bulkErrorMessage = bulkError instanceof Error ? bulkError.message : ''
  const activityErrorMessage = activityError instanceof Error ? activityError.message : ''
  const leaderboardErrorMessage = leaderboardError instanceof Error ? leaderboardError.message : ''
  const difficultyErrorMessage = difficultyError instanceof Error ? difficultyError.message : ''

  const overviewStats = useMemo(() => {
    const totalQuestions = activityData?.results?.reduce((sum, item) => sum + item.questions_answered, 0) ?? 0
    const questionsWeek = activityData?.results?.slice(-7).reduce((sum, item) => sum + item.questions_answered, 0) ?? 0
    return {
      totalLearners: leaderboard?.length ?? 0,
      activeThisWeek: aggregated?.active_users?.['7_days'] ?? 0,
      avgAccuracy: aggregated?.estimated_retention ? Math.round(aggregated.estimated_retention * 100) : 0,
      totalQuestionsAnswered: totalQuestions,
      questionsThisWeek: questionsWeek,
      totalReviews: aggregated?.review_count ?? 0,
    }
  }, [aggregated, leaderboard, activityData])

  const topLearners = useMemo(() => {
    if (!leaderboard) return []
    return leaderboard.slice(0, 5).map((entry) => ({
      name: entry.user ? `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.username : 'Unknown',
      xp: entry.total_xp,
      streak: entry.streak_count,
    }))
  }, [leaderboard])

  const fsrsMetrics = useMemo(() => {
    if (!bulkAnalytics?.results) return []
    return bulkAnalytics.results.map((item) => ({
      topic: item.topic_id,
      topic_name: item.topic_name,
      speed: item.metrics.avg_speed ?? 0,
      retention: Math.round((item.metrics.estimated_retention ?? 0) * 100),
    }))
  }, [bulkAnalytics])

  const topicPerformance = useMemo(() => {
    if (!bulkAnalytics?.results) return []
    return bulkAnalytics.results.map((item) => ({
      topic: item.topic_id,
      topic_name: item.topic_name,
      retention: typeof item.metrics.estimated_retention === 'number'
        ? Math.round(item.metrics.estimated_retention * 100)
        : null,
      learnerCount: item.metrics.learner_count,
    }))
  }, [bulkAnalytics])

  const difficultyBreakdown = useMemo(() => ({
    tier1: {
      attempts: difficultyData?.tiers?.['1']?.attempts ?? 0,
      accuracy: Math.round((difficultyData?.tiers?.['1']?.accuracy ?? 0) * 100),
    },
    tier2: {
      attempts: difficultyData?.tiers?.['2']?.attempts ?? 0,
      accuracy: Math.round((difficultyData?.tiers?.['2']?.accuracy ?? 0) * 100),
    },
    tier3: {
      attempts: difficultyData?.tiers?.['3']?.attempts ?? 0,
      accuracy: Math.round((difficultyData?.tiers?.['3']?.accuracy ?? 0) * 100),
    },
  }), [difficultyData])

  const weeklyActivity = useMemo(() => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (!activityData?.results || activityData.results.length === 0) {
      const list = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dayName = weekdayNames[d.getDay()]
        list.push({ day: dayName, learners: 0, questions: 0 })
      }
      return list
    }
    const last7 = activityData.results.slice(-7)
    return last7.map((item) => {
      const dateObj = new Date(item.date)
      const dayName = weekdayNames[isNaN(dateObj.getTime()) ? 0 : dateObj.getDay()]
      return {
        day: dayName,
        learners: item.active_learners,
        questions: item.questions_answered,
      }
    })
  }, [activityData])

  const maxDailyLearners = Math.max(...weeklyActivity.map((d) => d.learners), 1)

  // UC-04 Step 4a: Filter topics by search
  const filteredTopics = useMemo(() =>
    topicSearch
      ? topicPerformance.filter((item) =>
          item.topic_name.toLowerCase().includes(topicSearch.toLowerCase())
        )
      : topicPerformance,
    [topicSearch, topicPerformance]
  )

  // UC-04 Alternate Flow 2a: Insufficient data check
  const hasInsufficientData = !metricsError && overviewStats.totalReviews < 10

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin analytics"
        title={t('admin:learnerAnalytics')}
        description={t('admin:analyticsDescription')}
        icon={<BarChart3 className="h-6 w-6" />}
        tone="secondary"
      />

      {isLoadingOverview && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('common:loading')}</p>
      )}

      

      {contractErrors.length > 0 && (
        <Card className="dashboard-panel">
          <CardContent>
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                {t('admin:analyticsUnavailable')}
                </h2>
                <div className="space-y-1 text-sm text-rose-700 dark:text-rose-300">
                {contractErrors.map((error) => (
                  <p key={error.message}>{error.message}</p>
                ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasInsufficientData && (
        <Card className="dashboard-panel text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              {t('admin:insufficientData')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              {t('admin:insufficientDataDescription')}
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-3">
              {t('admin:reviewsCollected')}: {overviewStats.totalReviews}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PageStatCard
          icon={<Users className="h-5 w-5" />}
          label={t('admin:totalLearners')}
          value={lbLoading || leaderboardErrorMessage ? '--' : overviewStats.totalLearners}
          tone="secondary"
        />
        <PageStatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('admin:activeThisWeek')}
          value={metricsLoading || metricsError ? '--' : overviewStats.activeThisWeek}
          tone="success"
        />
        <PageStatCard
          icon={<Target className="h-5 w-5" />}
          label={t('admin:retention')}
          value={metricsLoading || metricsError ? '--' : `${overviewStats.avgAccuracy}%`}
          tone="primary"
        />
        <PageStatCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t('admin:totalReviews')}
          value={metricsLoading || metricsError ? '--' : overviewStats.totalReviews.toLocaleString()}
          tone="accent"
        />
      </div>

      {/* UC-04 Step 3: FSRS Metrics Section */}
      <Card className="dashboard-panel">
        <CardHeader
          title={t('admin:fsrsMetrics')}
          subtitle={t('admin:fsrsMetricsDescription')}
        />
        <CardContent>
          {bulkErrorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
              {bulkErrorMessage}
            </p>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fsrsMetrics.map((item) => (
              <div key={item.topic} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t(`topics:${item.topic}`, { defaultValue: item.topic_name })}
                </p>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {item.speed}d
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('admin:speed')}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {item.retention}%
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('admin:retention')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topic Performance */}
        <div className="lg:col-span-2">
          <Card className="dashboard-panel">
            <CardHeader 
              title={t('admin:topicPerformance')}
              subtitle={t('admin:retentionHealthHelper')}
            />
            <CardContent>
              {bulkErrorMessage ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {bulkErrorMessage}
                </p>
              ) : (
              <>
              {/* UC-04 Step 4/4a: Topic search/filter */}
              <div className="mb-4">
                <Input
                  placeholder={t('admin:searchTopics')}
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  size="sm"
                />
              </div>
              <div className="space-y-4">
                {filteredTopics.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                    {t('admin:filterByTopic')}
                  </p>
                ) : (
                filteredTopics.map((item) => (
                  <div key={item.topic} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {t(`topics:${item.topic}`, { defaultValue: item.topic_name })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {item.learnerCount.toLocaleString()} {t('admin:learners')}
                        </span>
                        <Badge 
                          variant={item.retention == null ? 'outline' : item.retention >= 75 ? 'success' : item.retention >= 60 ? 'secondary' : 'accent'}
                          size="sm"
                        >
                          {item.retention == null ? '--' : `${item.retention}%`}
                        </Badge>
                      </div>
                    </div>
                    <ProgressBar 
                      value={item.retention ?? 0} 
                      max={100} 
                      variant={item.retention == null ? 'secondary' : item.retention >= 75 ? 'success' : item.retention >= 60 ? 'secondary' : 'accent'}
                      size="sm"
                    />
                  </div>
                ))
                )}
              </div>
              </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <div className="space-y-6">
          <Card className="dashboard-panel">
            <CardHeader title={t('admin:difficultyBreakdown')} />
            <CardContent>
              {difficultyErrorMessage ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {difficultyErrorMessage}
                </p>
              ) : (
              <div className="flex justify-around">
                <div className="text-center">
                  <ProgressRing 
                    value={difficultyBreakdown.tier1.accuracy} 
                    size={70} 
                    strokeWidth={6}
                    variant="success"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{t('admin:tier1')}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{difficultyBreakdown.tier1.attempts.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <ProgressRing 
                    value={difficultyBreakdown.tier2.accuracy} 
                    size={70} 
                    strokeWidth={6}
                    variant="secondary"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{t('admin:tier2')}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{difficultyBreakdown.tier2.attempts.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <ProgressRing 
                    value={difficultyBreakdown.tier3.accuracy} 
                    size={70} 
                    strokeWidth={6}
                    variant="accent"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{t('admin:tier3')}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{difficultyBreakdown.tier3.attempts.toLocaleString()}</p>
                </div>
              </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Weekly Activity & Top Learners */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="dashboard-panel">
          <CardHeader 
            title={t('admin:weeklyActivity')}
            subtitle={t('admin:last7Days')}
          />
          <CardContent>
            {activityErrorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                {activityErrorMessage}
              </p>
            ) : (
            <>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary-500 rounded-t transition-all"
                    style={{ height: `${(day.learners / maxDailyLearners) * 100}%` }}
                    title={`${day.learners} learners, ${day.questions} questions`}
                  />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-500 rounded" />
                {t('admin:activeLearners')}
              </div>
            </div>
            </>
            )}
          </CardContent>
        </Card>

        {/* Top Learners */}
        <Card className="dashboard-panel">
          <CardHeader 
            title={t('admin:topLearners')}
            subtitle={t('admin:topLearnersDescription')}
          />
          <CardContent>
            {leaderboardErrorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                {leaderboardErrorMessage}
              </p>
            ) : (
            <div className="space-y-3">
              {topLearners.map((learner, index) => (
                <div key={learner.name} className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : ''}
                    ${index === 1 ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300' : ''}
                    ${index === 2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : ''}
                    ${index > 2 ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate">{learner.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('admin:experiencePointsValue', { value: learner.xp })}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    <Flame className="me-1 h-3 w-3 text-orange-500" />
                    {learner.streak}
                  </Badge>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Questions Stats */}
      <Card className="dashboard-panel">
        <CardHeader title={t('admin:questionStatistics')} />
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {activityErrorMessage ? '--' : overviewStats.totalQuestionsAnswered.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:totalAnswered')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {activityErrorMessage ? '--' : overviewStats.questionsThisWeek.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:thisWeek')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <BarChart3 className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {activityErrorMessage || leaderboardErrorMessage ? '--' : overviewStats.totalLearners > 0
                  ? Math.round(overviewStats.totalQuestionsAnswered / overviewStats.totalLearners)
                  : 0}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:avgPerLearner')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <BarChart3 className="w-8 h-8 text-accent-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {metricsError ? '--' : overviewStats.totalReviews.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:retention')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
