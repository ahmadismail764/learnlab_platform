import { 
  BookOpen, 
  Target, 
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, ProgressBar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * StudentDashboard
 * 
 * Main landing page for students showing:
 * - Welcome message
 * - Quick actions (Continue Learning, Practice)
 * - Progress overview
 * - Recent activity
 * RTL-aware with full i18n support.
 */

export function StudentDashboard() {
  const { t } = useTranslation(['student', 'common', 'topics', 'gamification'])
  const user = useCurrentUser()

  // Mock data - will come from API
  const stats = {
    questionsToday: 12,
    totalMastered: 156,
    topicsInProgress: 6,
    topicsDue: 3,
    totalXP: 1250,
  }

  // Discrete Mathematics topics - FSRS due for review
  const topicsDueForReview = [
    { id: '1', nameKey: 'topics:logic.propositional', progress: 68, icon: '🔢', questionsLeft: 8 },
    { id: '2', nameKey: 'topics:sets.operations', progress: 45, icon: '∪', questionsLeft: 15 },
    { id: '3', nameKey: 'topics:relations.equivalence', progress: 82, icon: '≡', questionsLeft: 4 },
  ]

  const achievements = [
    { id: '1', nameKey: 'gamification:achievements.firstSteps', icon: '🎯', earned: true },
    { id: '2', nameKey: 'gamification:achievements.mathWhiz', icon: '🧮', earned: true },
    { id: '3', nameKey: 'gamification:achievements.perfectScore', icon: '⭐', earned: false },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {t('student:welcomeBack', { name: user.firstName })}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t('student:readyToContinue')}
          </p>
        </div>
      </div>

      {/* Session Progress Card */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-primary-100 text-sm">{t('student:todaysProgress')}</p>
            <p className="text-3xl font-bold mt-1">
              {t('student:questionsAnsweredToday', { count: stats.questionsToday })}
            </p>
            <p className="text-primary-100 text-sm mt-1">
              {t('student:topicsProgress', { due: stats.topicsDue })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/student/practice">
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('student:startSession')}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.totalMastered}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:questionsMastered')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.topicsInProgress}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:activeTopics')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.totalXP}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('gamification:totalXP')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">2.5h</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:thisWeek')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topics Due for Review */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{t('student:todaysQueue')}</h2>
            <Link to="/student/topics" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <div className="space-y-4">
            {topicsDueForReview.map((topic) => (
              <Link key={topic.id} to={`/student/practice?topic=${topic.id}`} className="block">
                <Card hoverable padding="sm">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-neutral-800 dark:text-neutral-100">{t(topic.nameKey)}</h3>
                        <Badge variant="primary" size="sm">
                          {t('student:topicsLeft', { count: topic.questionsLeft })}
                        </Badge>
                      </div>
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{t('student:achievements')}</h2>
            <Link to="/student/achievements" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <Card>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`flex flex-col items-center p-3 rounded-lg ${
                    achievement.earned 
                      ? 'bg-accent-50 dark:bg-accent-900/20' 
                      : 'bg-neutral-100 dark:bg-neutral-800 opacity-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className={`text-xs text-center ${
                    achievement.earned ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {t(achievement.nameKey)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title={t('common:quickActions')} />
            <CardContent className="space-y-2">
              <Link to="/student/practice">
                <Button variant="primary" fullWidth leftIcon={<Zap className="w-4 h-4" />}>
                  {t('nav:practice')}
                </Button>
              </Link>
              <Link to="/student/topics">
                <Button variant="outline" fullWidth leftIcon={<BookOpen className="w-4 h-4" />}>
                  {t('nav:topics')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
