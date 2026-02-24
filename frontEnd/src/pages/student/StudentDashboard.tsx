import { 
  BookOpen, 
  Target, 
  Clock,
  ChevronRight,
  Zap,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * StudentDashboard
 * 
 * Main landing page for students showing:
 * - Welcome message with brand-gradient hero card
 * - Progress overview with branded stat cards
 * - Topics due for review
 * - Recent achievements
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
      {/* Hero — branded gradient with decorative nodes */}
      <Card className="relative overflow-hidden bg-linear-to-br from-primary-600 via-primary-500 to-secondary-600 text-white border-0">
        {/* Decorative graph nodes */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <circle cx="500" cy="30" r="6" fill="white"/>
            <circle cx="540" cy="80" r="4" fill="white"/>
            <circle cx="460" cy="100" r="5" fill="white"/>
            <circle cx="520" cy="150" r="7" fill="white"/>
            <circle cx="400" cy="60" r="3" fill="white"/>
            <line x1="500" y1="30" x2="540" y2="80" stroke="white" strokeWidth="1.5"/>
            <line x1="540" y1="80" x2="520" y2="150" stroke="white" strokeWidth="1.5"/>
            <line x1="460" y1="100" x2="520" y2="150" stroke="white" strokeWidth="1.5"/>
            <line x1="400" y1="60" x2="460" y2="100" stroke="white" strokeWidth="1.5"/>
            <line x1="500" y1="30" x2="400" y2="60" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent-300" />
              <p className="text-white/70 text-sm">{t('student:todaysProgress')}</p>
            </div>
            <h1 className="text-2xl font-bold font-display">
              {t('student:welcomeBack', { name: user.firstName })}
            </h1>
            <p className="text-3xl font-bold mt-2 font-display">
              {t('student:questionsAnsweredToday', { count: stats.questionsToday })}
            </p>
            <p className="text-white/70 text-sm mt-1">
              {t('student:topicsProgress', { due: stats.topicsDue })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/student/practice">
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('student:startSession')}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Grid — branded icon backgrounds */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalMastered}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:questionsMastered')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.topicsInProgress}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:activeTopics')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-100 dark:bg-accent-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalXP}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('gamification:totalXP')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-primary-700 dark:text-primary-300" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">2.5h</p>
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
            <h2 className="text-lg font-semibold font-display text-neutral-800 dark:text-neutral-100">{t('student:todaysQueue')}</h2>
            <Link to="/student/topics" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <div className="space-y-3">
            {topicsDueForReview.map((topic) => (
              <Link key={topic.id} to={`/student/practice?topic=${topic.id}`} className="block group">
                <Card hoverable padding="sm" className="group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl shrink-0">
                      {topic.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-medium text-neutral-800 dark:text-neutral-100">{t(topic.nameKey)}</h3>
                        <Badge variant="primary" size="sm">
                          {t('student:topicsLeft', { count: topic.questionsLeft })}
                        </Badge>
                      </div>
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 rtl:rotate-180 transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display text-neutral-800 dark:text-neutral-100">{t('student:achievements')}</h2>
            <Link to="/student/achievements" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <Card>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`flex flex-col items-center p-3 rounded-xl transition-transform hover:scale-[1.02] ${
                    achievement.earned 
                      ? 'bg-accent-50 dark:bg-accent-900/20 ring-1 ring-accent-200/50 dark:ring-accent-800/30' 
                      : 'bg-neutral-100 dark:bg-neutral-800 opacity-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className={`text-xs text-center font-medium ${
                    achievement.earned ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {t(achievement.nameKey)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
