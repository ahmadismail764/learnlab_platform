import { 
  BookOpen, 
  Trophy, 
  Target, 
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, ProgressBar, ProgressRing, Streak } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * StudentDashboard
 * 
 * Main landing page for students showing:
 * - Welcome message & streak
 * - Quick actions (Continue Learning, Practice)
 * - Progress overview
 * - Recent activity
 * RTL-aware with full i18n support.
 */

export function StudentDashboard() {
  const { t } = useTranslation(['student', 'common', 'topics'])
  const user = useCurrentUser()

  // Mock data - will come from API
  const stats = {
    streak: 7,
    questionsToday: 12,
    dailyGoal: 20,
    totalMastered: 156,
    topicsInProgress: 6,
    topicsDue: 3,
  }

  // Discrete Mathematics topics - FSRS due for review
  const topicsDueForReview = [
    { id: '1', nameKey: 'topics:logic.propositional', progress: 68, icon: '🔢', questionsLeft: 8 },
    { id: '2', nameKey: 'topics:sets.operations', progress: 45, icon: '∪', questionsLeft: 15 },
    { id: '3', nameKey: 'topics:relations.equivalence', progress: 82, icon: '≡', questionsLeft: 4 },
  ]

  const achievements = [
    { id: '1', name: 'First Steps', icon: '🎯', earned: true },
    { id: '2', name: '7 Day Streak', icon: '🔥', earned: true },
    { id: '3', name: 'Math Whiz', icon: '🧮', earned: false },
    { id: '4', name: 'Bookworm', icon: '📖', earned: false },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">
            {t('student:welcomeBack', { name: user.firstName })}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('student:readyToContinue')}
          </p>
        </div>
        <Streak count={stats.streak} label={t('student:dayStreak')} />
      </div>

      {/* Daily Progress Card */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-primary-100 text-sm">{t('student:todaysProgress')}</p>
            <p className="text-3xl font-bold mt-1">
              {t('student:questionsProgress', { done: stats.questionsToday, goal: stats.dailyGoal })}
            </p>
            <p className="text-primary-100 text-sm mt-1">
              {t('student:moreToGoal', { remaining: stats.dailyGoal - stats.questionsToday })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing 
              value={(stats.questionsToday / stats.dailyGoal) * 100} 
              size={80}
              strokeWidth={6}
              variant="success"
            />
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('student:continue')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.totalMastered}</p>
              <p className="text-xs text-neutral-500">{t('student:questionsMastered')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.topicsInProgress}</p>
              <p className="text-xs text-neutral-500">{t('student:activeTopics')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Zap className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.streak}</p>
              <p className="text-xs text-neutral-500">{t('student:dayStreak')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">2.5h</p>
              <p className="text-xs text-neutral-500">{t('student:thisWeek')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topics Due for Review */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800">{t('student:todaysQueue')}</h2>
            <Link to="/student/topics" className="text-sm text-primary-600 hover:text-primary-700">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <div className="space-y-3">
            {topicsDueForReview.map((topic) => (
              <Card key={topic.id} hoverable padding="sm">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{topic.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-neutral-800">{t(topic.nameKey)}</h3>
                      <Badge variant="primary" size="sm">
                        {t('student:topicsLeft', { count: topic.questionsLeft })}
                      </Badge>
                    </div>
                    <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800">{t('student:achievements')}</h2>
            <Link to="/student/achievements" className="text-sm text-primary-600 hover:text-primary-700">
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
                      ? 'bg-accent-50' 
                      : 'bg-neutral-100 opacity-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className={`text-xs text-center ${
                    achievement.earned ? 'text-neutral-700' : 'text-neutral-500'
                  }`}>
                    {achievement.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title={t('common:quickActions')} />
            <CardContent className="space-y-2">
              <Button variant="primary" fullWidth leftIcon={<Zap className="w-4 h-4" />}>
                {t('nav:practice')}
              </Button>
              <Button variant="outline" fullWidth leftIcon={<Trophy className="w-4 h-4" />}>
                {t('nav:progress')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
