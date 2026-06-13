import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Activity,
  Search,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Badge, Input, Button } from '@/components/ui'
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

  const { data: aggregated, isLoading: metricsLoading } = useAggregatedMetrics()
  const { data: leaderboard, isLoading: lbLoading } = useGlobalLeaderboard()
  const { data: bulkAnalytics, isLoading: bulkLoading } = useBulkTopicAnalytics()
  const { data: activityData, isLoading: activityLoading } = useActivityTimeSeries()
  const { data: difficultyData, isLoading: difficultyLoading } = useDifficultyBreakdown()

  const isLoadingOverview = metricsLoading || lbLoading || bulkLoading || activityLoading || difficultyLoading

  // Mock analytics data mixed with real dashboard overview metrics
  const overviewStats = useMemo(() => {
    const totalQuestions = activityData?.results?.reduce((sum, item) => sum + item.questions_answered, 0) ?? 0
    const questionsWeek = activityData?.results?.slice(-7).reduce((sum, item) => sum + item.questions_answered, 0) ?? 0
    return {
      totalLearners: leaderboard?.length ?? 0,
      activeThisWeek: aggregated?.active_users?.['7_days'] ?? 0,
      avgAccuracy: aggregated?.estimated_retention ? Math.round(aggregated.estimated_retention * 100) : 0,
      avgSessionTime: aggregated?.mastery_averages?.avg_speed ? Math.round(aggregated.mastery_averages.avg_speed * 10) : 0, // minutes
      totalQuestionsAnswered: totalQuestions,
      questionsThisWeek: questionsWeek,
      totalReviews: aggregated?.review_count ?? 0,
    }
  }, [aggregated, leaderboard, activityData])

  const topLearners = useMemo(() => {
    if (!leaderboard) return []
    return leaderboard.slice(0, 5).map((entry) => ({
      name: entry.user ? `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.username : 'Unknown',
      accuracy: 0,
      questionsAnswered: 0,
      xp: entry.total_xp,
    }))
  }, [leaderboard])

  // UC-04 Step 3: FSRS-specific metrics per topic (mock data replaced)
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
      accuracy: Math.round((item.metrics.estimated_retention ?? 0.75) * 100),
      attempts: item.metrics.learner_count * 15,
      avgTime: Math.round((item.metrics.avg_speed ?? 1) * 45),
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

  const maxAttempts = Math.max(...topicPerformance.map((t) => t.attempts), 1)
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
  const hasInsufficientData = overviewStats.totalReviews < 10

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin analytics"
        title={t('admin:learnerAnalytics')}
        description={t('admin:analyticsDescription')}
        icon={<BarChart3 className="h-6 w-6" />}
        tone="secondary"
        actions={(
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => { /* Export CSV — backend integration */ }}
            >
              {t('admin:exportCSV')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => { /* Export PDF — backend integration */ }}
            >
              {t('admin:exportPDF')}
            </Button>
          </>
        )}
      />

      {isLoadingOverview && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('common:loading')}</p>
      )}

      

      {/* UC-04 Alternate Flow 2a: Insufficient data empty state */}
      {hasInsufficientData ? (
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
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PageStatCard
          icon={<Users className="h-5 w-5" />}
          label={t('admin:totalLearners')}
          value={overviewStats.totalLearners}
          tone="secondary"
        />
        <PageStatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('admin:activeThisWeek')}
          value={overviewStats.activeThisWeek}
          tone="success"
        />
        <PageStatCard
          icon={<Target className="h-5 w-5" />}
          label={t('admin:avgAccuracy')}
          value={`${overviewStats.avgAccuracy}%`}
          tone="primary"
        />
        <PageStatCard
          icon={<Clock className="h-5 w-5" />}
          label={t('admin:avgSessionTime')}
          value={`${overviewStats.avgSessionTime}m`}
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
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topic Performance */}
        <div className="lg:col-span-2">
          <Card className="dashboard-panel">
            <CardHeader 
              title={t('admin:topicPerformance')}
              subtitle={t('admin:accuracyByTopic')}
            />
            <CardContent>
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
                          {item.attempts.toLocaleString()} {t('admin:attempts')}
                        </span>
                        <Badge 
                          variant={item.accuracy >= 75 ? 'success' : item.accuracy >= 60 ? 'secondary' : 'accent'}
                          size="sm"
                        >
                          {item.accuracy}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ProgressBar 
                        value={item.accuracy} 
                        max={100} 
                        variant={item.accuracy >= 75 ? 'success' : item.accuracy >= 60 ? 'secondary' : 'accent'}
                        size="sm"
                        className="flex-1"
                      />
                      <div 
                        className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full"
                        style={{ width: `${(item.attempts / maxAttempts) * 100}%`, maxWidth: '100px' }}
                        title={`${item.attempts} attempts`}
                      />
                    </div>
                  </div>
                ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <div className="space-y-6">
          <Card className="dashboard-panel">
            <CardHeader title={t('admin:difficultyBreakdown')} />
            <CardContent>
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
          </CardContent>
        </Card>

        {/* Top Learners */}
        <Card className="dashboard-panel">
          <CardHeader 
            title={t('admin:topLearners')}
            subtitle={t('admin:byAccuracy')}
          />
          <CardContent>
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
                      {learner.questionsAnswered > 0
                        ? `${learner.questionsAnswered} ${t('admin:questionsAnswered')}`
                        : `${t('admin:questionsAnswered')}: --`} • {t('admin:experiencePointsValue', { value: learner.xp })}
                    </p>
                  </div>
                  <Badge 
                    variant={learner.accuracy >= 90 ? 'success' : 'primary'}
                    size="sm"
                  >
                    {learner.accuracy > 0 ? `${learner.accuracy}%` : '--'}
                  </Badge>
                </div>
              ))}
            </div>
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
                {overviewStats.totalQuestionsAnswered.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:totalAnswered')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {overviewStats.questionsThisWeek.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:thisWeek')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <BarChart3 className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {Math.round(overviewStats.totalQuestionsAnswered / overviewStats.totalLearners)}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:avgPerLearner')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <BarChart3 className="w-8 h-8 text-accent-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {overviewStats.totalReviews.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:retention')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}
