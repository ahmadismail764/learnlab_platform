import { useState, useMemo, useEffect } from 'react'
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
import { analyticsService, learnersService } from '@/services'

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
  const fallbackTopLearners = useMemo(() => [
    { name: 'أحمد محمد', accuracy: 94, questionsAnswered: 342, xp: 4520 },
    { name: 'فاطمة علي', accuracy: 91, questionsAnswered: 298, xp: 3980 },
    { name: 'يوسف حسن', accuracy: 89, questionsAnswered: 276, xp: 3650 },
    { name: 'نور الدين', accuracy: 88, questionsAnswered: 265, xp: 3420 },
    { name: 'سارة أحمد', accuracy: 87, questionsAnswered: 254, xp: 3280 },
  ], [])
  const [topicSearch, setTopicSearch] = useState('')
  const [overviewMetrics, setOverviewMetrics] = useState<{
    totalLearners: number
    activeThisWeek: number
    totalReviews: number
  } | null>(null)
  const [topLearners, setTopLearners] = useState(fallbackTopLearners)
  const [isLoadingOverview, setIsLoadingOverview] = useState(false)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadOverview = async () => {
      setIsLoadingOverview(true)
      setOverviewError(null)

      try {
        const [aggregated, leaderboard] = await Promise.all([
          analyticsService.getAggregatedMetrics(),
          learnersService.getLeaderboard(),
        ])

        if (!isMounted) return

        setOverviewMetrics({
          totalLearners: leaderboard.length,
          activeThisWeek: aggregated.active_users['7_days'],
          totalReviews: aggregated.review_count,
        })

        setTopLearners(
          leaderboard.slice(0, 5).map((entry) => ({
            name: `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.username,
            accuracy: 0,
            questionsAnswered: 0,
            xp: entry.total_xp,
          })),
        )
      } catch (error) {
        if (!isMounted) return
        const message = error instanceof Error ? error.message : 'Failed to fetch analytics overview'
        setOverviewError(message)
        setOverviewMetrics(null)
        setTopLearners(fallbackTopLearners)
      } finally {
        if (isMounted) {
          setIsLoadingOverview(false)
        }
      }
    }

    loadOverview()

    return () => {
      isMounted = false
    }
  }, [fallbackTopLearners])

  // Mock analytics data
  const overviewStats = useMemo(() => ({
    totalLearners: overviewMetrics?.totalLearners ?? 1150,
    activeThisWeek: overviewMetrics?.activeThisWeek ?? 892,
    avgAccuracy: 73,
    avgSessionTime: 24, // minutes
    totalQuestionsAnswered: 45320,
    questionsThisWeek: 3420,
    totalReviews: overviewMetrics?.totalReviews ?? 45320, // For insufficient-data check (UC-04 alt flow 2a)
  }), [overviewMetrics])

  // UC-04 Step 3: FIRe-specific metrics per topic (mock data)
  const fsrsMetrics = [
    { topic: 'logic', speed: 14.2, retention: 92 },
    { topic: 'sets', speed: 11.5, retention: 88 },
    { topic: 'relations', speed: 8.7, retention: 82 },
    { topic: 'combinatorics', speed: 6.3, retention: 76 },
    { topic: 'graphs', speed: 9.8, retention: 85 },
    { topic: 'numtheory', speed: 7.1, retention: 79 },
  ]

  const topicPerformance = [
    { topic: 'logic', accuracy: 78, attempts: 12450, avgTime: 45 },
    { topic: 'sets', accuracy: 72, attempts: 9870, avgTime: 52 },
    { topic: 'relations', accuracy: 68, attempts: 8340, avgTime: 58 },
    { topic: 'combinatorics', accuracy: 65, attempts: 7210, avgTime: 62 },
    { topic: 'graphs', accuracy: 71, attempts: 4560, avgTime: 48 },
    { topic: 'numtheory', accuracy: 69, attempts: 2890, avgTime: 55 },
  ]

  const difficultyBreakdown = {
    tier1: { attempts: 18500, accuracy: 85 },
    tier2: { attempts: 17200, accuracy: 68 },
    tier3: { attempts: 9620, accuracy: 52 },
  }

  const weeklyActivity = [
    { day: 'Sat', learners: 420, questions: 2100 },
    { day: 'Sun', learners: 380, questions: 1850 },
    { day: 'Mon', learners: 520, questions: 2800 },
    { day: 'Tue', learners: 490, questions: 2650 },
    { day: 'Wed', learners: 510, questions: 2750 },
    { day: 'Thu', learners: 470, questions: 2400 },
    { day: 'Fri', learners: 350, questions: 1700 },
  ]



  const maxAttempts = useMemo(() => 
    Math.max(...topicPerformance.map(t => t.attempts)),
    [topicPerformance]
  )

  const maxDailyLearners = useMemo(() =>
    Math.max(...weeklyActivity.map(d => d.learners)),
    [weeklyActivity]
  )

  // UC-04 Step 4a: Filter topics by search
  const filteredTopics = useMemo(() =>
    topicSearch
      ? topicPerformance.filter(item =>
          t(`topics:${item.topic}`).toLowerCase().includes(topicSearch.toLowerCase())
        )
      : topicPerformance,
    [topicSearch, topicPerformance, t]
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

      {overviewError && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{overviewError}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
            Showing fallback demo values for unavailable analytics fields.
          </p>
        </div>
      )}

      {/* UC-04 Alternate Flow 2a: Insufficient data empty state */}
      {hasInsufficientData ? (
        <Card className="text-center py-12">
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

      {/* UC-04 Step 3: FIRe Metrics Section */}
      <Card>
        <CardHeader
          title={t('admin:fsrsMetrics')}
          subtitle={t('admin:fsrsMetricsDescription')}
        />
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fsrsMetrics.map((item) => (
              <div key={item.topic} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t(`topics:${item.topic}`)}
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
          <Card>
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
                        {t(`topics:${item.topic}`)}
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
          <Card>
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
        <Card>
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
        <Card>
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
                        : `${t('admin:questionsAnswered')}: --`} • {learner.xp} XP
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
      <Card>
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
