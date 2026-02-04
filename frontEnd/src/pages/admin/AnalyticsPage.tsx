import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  Award,
  BarChart3,
  Activity,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Badge } from '@/components/ui'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'

/**
 * AnalyticsPage - Admin Student Analytics Dashboard
 * 
 * Features:
 * - Aggregate student metrics
 * - Topic performance overview
 * - Activity trends
 * - Achievement statistics
 */

export function AnalyticsPage() {
  const { t } = useTranslation(['admin', 'common', 'topics'])

  // Mock analytics data
  const overviewStats = {
    totalStudents: 1150,
    activeThisWeek: 892,
    avgAccuracy: 73,
    avgSessionTime: 24, // minutes
    totalQuestionsAnswered: 45320,
    questionsThisWeek: 3420,
  }

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
    { day: 'Sat', students: 420, questions: 2100 },
    { day: 'Sun', students: 380, questions: 1850 },
    { day: 'Mon', students: 520, questions: 2800 },
    { day: 'Tue', students: 490, questions: 2650 },
    { day: 'Wed', students: 510, questions: 2750 },
    { day: 'Thu', students: 470, questions: 2400 },
    { day: 'Fri', students: 350, questions: 1700 },
  ]

  const achievementStats = {
    totalUnlocked: 3240,
    averagePerStudent: 2.8,
    mostCommon: 'First Steps',
    rarest: 'Perfect Master',
  }

  const topStudents = [
    { name: 'أحمد محمد', accuracy: 94, questionsAnswered: 342, xp: 4520 },
    { name: 'فاطمة علي', accuracy: 91, questionsAnswered: 298, xp: 3980 },
    { name: 'يوسف حسن', accuracy: 89, questionsAnswered: 276, xp: 3650 },
    { name: 'نور الدين', accuracy: 88, questionsAnswered: 265, xp: 3420 },
    { name: 'سارة أحمد', accuracy: 87, questionsAnswered: 254, xp: 3280 },
  ]

  const maxAttempts = useMemo(() => 
    Math.max(...topicPerformance.map(t => t.attempts)),
    [topicPerformance]
  )

  const maxDailyStudents = useMemo(() =>
    Math.max(...weeklyActivity.map(d => d.students)),
    [weeklyActivity]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          {t('admin:studentAnalytics')}
        </h1>
        <p className="text-neutral-600 mt-1">
          {t('admin:analyticsDescription')}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Users className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{overviewStats.totalStudents}</p>
              <p className="text-xs text-neutral-500">{t('admin:totalStudents')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{overviewStats.activeThisWeek}</p>
              <p className="text-xs text-neutral-500">{t('admin:activeThisWeek')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{overviewStats.avgAccuracy}%</p>
              <p className="text-xs text-neutral-500">{t('admin:avgAccuracy')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Clock className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{overviewStats.avgSessionTime}m</p>
              <p className="text-xs text-neutral-500">{t('admin:avgSessionTime')}</p>
            </div>
          </div>
        </Card>
      </div>

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
              <div className="space-y-4">
                {topicPerformance.map((item) => (
                  <div key={item.topic} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">
                        {t(`topics:${item.topic}`)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500">
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
                        className="h-2 bg-neutral-200 rounded-full"
                        style={{ width: `${(item.attempts / maxAttempts) * 100}%`, maxWidth: '100px' }}
                        title={`${item.attempts} attempts`}
                      />
                    </div>
                  </div>
                ))}
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
                  <p className="text-xs text-neutral-500 mt-2">{t('admin:tier1')}</p>
                  <p className="text-xs text-neutral-400">{difficultyBreakdown.tier1.attempts.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <ProgressRing 
                    value={difficultyBreakdown.tier2.accuracy} 
                    size={70} 
                    strokeWidth={6}
                    variant="secondary"
                  />
                  <p className="text-xs text-neutral-500 mt-2">{t('admin:tier2')}</p>
                  <p className="text-xs text-neutral-400">{difficultyBreakdown.tier2.attempts.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <ProgressRing 
                    value={difficultyBreakdown.tier3.accuracy} 
                    size={70} 
                    strokeWidth={6}
                    variant="accent"
                  />
                  <p className="text-xs text-neutral-500 mt-2">{t('admin:tier3')}</p>
                  <p className="text-xs text-neutral-400">{difficultyBreakdown.tier3.attempts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Stats */}
          <Card>
            <CardHeader title={t('admin:achievementStats')} />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{t('admin:totalUnlocked')}</span>
                  <span className="font-medium text-neutral-800">{achievementStats.totalUnlocked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{t('admin:avgPerStudent')}</span>
                  <span className="font-medium text-neutral-800">{achievementStats.averagePerStudent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{t('admin:mostCommon')}</span>
                  <Badge variant="primary" size="sm">{achievementStats.mostCommon}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{t('admin:rarest')}</span>
                  <Badge variant="accent" size="sm">{achievementStats.rarest}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Activity & Top Students */}
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
                    style={{ height: `${(day.students / maxDailyStudents) * 100}%` }}
                    title={`${day.students} students, ${day.questions} questions`}
                  />
                  <span className="text-xs text-neutral-500">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-6 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-500 rounded" />
                {t('admin:activeStudents')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader 
            title={t('admin:topStudents')}
            subtitle={t('admin:byAccuracy')}
          />
          <CardContent>
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div key={student.name} className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${index === 1 ? 'bg-neutral-200 text-neutral-600' : ''}
                    ${index === 2 ? 'bg-amber-100 text-amber-700' : ''}
                    ${index > 2 ? 'bg-neutral-100 text-neutral-500' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">{student.name}</p>
                    <p className="text-xs text-neutral-500">
                      {student.questionsAnswered} {t('admin:questionsAnswered')} • {student.xp} XP
                    </p>
                  </div>
                  <Badge 
                    variant={student.accuracy >= 90 ? 'success' : 'primary'}
                    size="sm"
                  >
                    {student.accuracy}%
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
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800">
                {overviewStats.totalQuestionsAnswered.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500">{t('admin:totalAnswered')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800">
                {overviewStats.questionsThisWeek.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500">{t('admin:thisWeek')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800">
                {Math.round(overviewStats.totalQuestionsAnswered / overviewStats.totalStudents)}
              </p>
              <p className="text-sm text-neutral-500">{t('admin:avgPerStudent')}</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <Award className="w-8 h-8 text-accent-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-800">
                {achievementStats.totalUnlocked.toLocaleString()}
              </p>
              <p className="text-sm text-neutral-500">{t('admin:achievementsUnlocked')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
