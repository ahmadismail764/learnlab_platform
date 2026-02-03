import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  Target, 
  Clock,
  Calendar,
  ChevronRight,
  Brain,
  Zap
} from 'lucide-react'
import { Card, CardHeader, CardContent, ProgressBar, Badge, Button } from '@/components/ui'

/**
 * ProgressPage
 * 
 * Shows detailed learning progress with FSRS-based metrics.
 * Displays mastery levels, time spent, and topic breakdown.
 */

interface TopicProgress {
  id: string
  nameKey: string
  icon: string
  mastery: number
  questionsAnswered: number
  questionsTotal: number
  stability: number // FSRS stability score (days)
  nextReview: string
  state: 'new' | 'learning' | 'review' | 'mastered'
}

// Mock progress data - will come from FSRS backend
const weeklyStats = {
  questionsAnswered: 87,
  questionsCorrect: 72,
  timeSpent: '4h 32m',
  xpEarned: 1850,
  topicsReviewed: 12,
  averageAccuracy: 83,
}

const monthlyProgress = [
  { week: 'Week 1', questions: 45, accuracy: 78 },
  { week: 'Week 2', questions: 62, accuracy: 81 },
  { week: 'Week 3', questions: 58, accuracy: 85 },
  { week: 'Week 4', questions: 87, accuracy: 83 },
]

const topicProgress: TopicProgress[] = [
  { 
    id: '1', 
    nameKey: 'topics:logic.propositional', 
    icon: '→', 
    mastery: 85, 
    questionsAnswered: 45, 
    questionsTotal: 50,
    stability: 14.5,
    nextReview: 'In 3 days',
    state: 'mastered'
  },
  { 
    id: '2', 
    nameKey: 'topics:sets.operations', 
    icon: '∩', 
    mastery: 72, 
    questionsAnswered: 32, 
    questionsTotal: 45,
    stability: 7.2,
    nextReview: 'Tomorrow',
    state: 'review'
  },
  { 
    id: '3', 
    nameKey: 'topics:relations.equivalence', 
    icon: '~', 
    mastery: 45, 
    questionsAnswered: 18, 
    questionsTotal: 40,
    stability: 2.1,
    nextReview: 'Today',
    state: 'learning'
  },
  { 
    id: '4', 
    nameKey: 'topics:combinatorics.counting', 
    icon: '#', 
    mastery: 92, 
    questionsAnswered: 28, 
    questionsTotal: 30,
    stability: 21.3,
    nextReview: 'In 1 week',
    state: 'mastered'
  },
  { 
    id: '5', 
    nameKey: 'topics:graphTheory.basics', 
    icon: 'G', 
    mastery: 30, 
    questionsAnswered: 12, 
    questionsTotal: 40,
    stability: 1.5,
    nextReview: 'Today',
    state: 'learning'
  },
]

export function ProgressPage() {
  const { t } = useTranslation(['student', 'topics', 'common', 'gamification'])

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600'
    if (mastery >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getStateColor = (state: TopicProgress['state']) => {
    switch (state) {
      case 'mastered': return 'bg-green-100 text-green-700'
      case 'review': return 'bg-blue-100 text-blue-700'
      case 'learning': return 'bg-amber-100 text-amber-700'
      case 'new': return 'bg-neutral-100 text-neutral-600'
    }
  }

  const getStateLabel = (state: TopicProgress['state']) => {
    switch (state) {
      case 'mastered': return 'Mastered'
      case 'review': return 'Review'
      case 'learning': return 'Learning'
      case 'new': return 'New'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          {t('student:myProgress')}
        </h1>
        <p className="text-neutral-600 mt-1">
          {t('student:progressDescription')}
        </p>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{weeklyStats.questionsAnswered}</p>
              <p className="text-xs text-neutral-500">{t('student:questionsThisWeek')}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{weeklyStats.averageAccuracy}%</p>
              <p className="text-xs text-neutral-500">{t('student:accuracyRate')}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Clock className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{weeklyStats.timeSpent}</p>
              <p className="text-xs text-neutral-500">{t('student:timeSpent')}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Zap className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{weeklyStats.xpEarned}</p>
              <p className="text-xs text-neutral-500">{t('student:xpEarned')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader title={t('student:monthlyProgress')} />
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {monthlyProgress.map((week, index) => {
              const correctCount = Math.round(week.questions * week.accuracy / 100)
              const incorrectCount = week.questions - correctCount
              
              return (
                <div key={index} className="text-center">
                  <div className="relative h-32 bg-neutral-50 rounded-lg overflow-hidden mb-2 border border-neutral-200">
                    {/* Stacked bar chart - incorrect on top, correct on bottom */}
                    <div className="absolute bottom-0 w-full flex flex-col">
                      {/* Incorrect answers (red/orange) */}
                      <div 
                        className="w-full bg-red-400"
                        style={{ height: `${(incorrectCount / 100) * 128}px` }}
                      />
                      {/* Correct answers (blue) */}
                      <div 
                        className="w-full bg-primary-500"
                        style={{ height: `${(correctCount / 100) * 128}px` }}
                      />
                    </div>
                    {/* Count labels */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold text-sm pointer-events-none">
                      <span className="drop-shadow-md">{week.questions}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">{t('student:week', { number: index + 1 })}</p>
                  <p className="text-xs text-neutral-500">{week.accuracy}% {t('student:accuracyRate').toLowerCase()}</p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded" />
              <span className="text-neutral-600">{t('student:correctAnswers')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span className="text-neutral-600">{t('student:incorrectAnswers')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Mastery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">{t('student:topicMastery')}</h2>
          <Link to="/student/topics" className="text-sm text-primary-600 hover:text-primary-700">
            {t('common:viewAll')}
          </Link>
        </div>

        <div className="space-y-4">
          {topicProgress.map((topic) => (
            <Card key={topic.id} padding="sm">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-xl font-mono">
                  {topic.icon}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-neutral-800">{t(topic.nameKey)}</h3>
                    <Badge size="sm" className={getStateColor(topic.state)}>
                      {getStateLabel(topic.state)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <ProgressBar value={topic.mastery} size="sm" className="flex-1" showLabel={false} />
                    <span className={`text-sm font-semibold ${getMasteryColor(topic.mastery)}`}>
                      {topic.mastery}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {topic.questionsAnswered}/{topic.questionsTotal} {t('student:questions')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      {t('student:stability')}: {t('student:stabilityDays', { days: topic.stability.toFixed(1) })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {topic.nextReview}
                    </span>
                  </div>
                </div>

                <Link to={`/student/practice?topic=${topic.id}`}>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FSRS Info Card */}
      <Card className="bg-linear-to-r from-secondary-50 to-secondary-100 border-secondary-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Brain className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary-800">{t('student:poweredByFSRS')}</h3>
            <p className="text-sm text-secondary-700 mt-1">
              {t('student:fsrsDescription')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
