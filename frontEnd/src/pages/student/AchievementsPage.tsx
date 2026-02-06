import { useTranslation } from 'react-i18next'
import { 
  Trophy, 
  Zap, 
  Clock, 
  BookOpen,
  Star,
  Award,
  CheckCircle,
  Lock
} from 'lucide-react'
import { Card, ProgressBar, Badge } from '@/components/ui'

/**
 * AchievementsPage
 * 
 * Shows all achievements with their unlock conditions and progress.
 * Each achievement displays how it was earned or how to earn it.
 */

interface Achievement {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  emoji: string
  earned: boolean
  earnedDate?: string
  progress?: number
  requirement: string
  xpReward: number
  category: 'learning' | 'mastery' | 'consistency' | 'special'
}

// Mock achievements data
const achievements: Achievement[] = [
  // Learning achievements
  {
    id: 'first-steps',
    nameKey: 'gamification:achievements.firstSteps',
    descriptionKey: 'Complete your first practice session',
    icon: 'Target',
    emoji: '🎯',
    earned: true,
    earnedDate: 'Jan 15, 2026',
    requirement: 'Complete 1 practice session',
    xpReward: 50,
    category: 'learning'
  },
  {
    id: 'math-whiz',
    nameKey: 'gamification:achievements.mathWhiz',
    descriptionKey: 'Answer 100 questions correctly',
    icon: 'Zap',
    emoji: '🧮',
    earned: true,
    earnedDate: 'Jan 28, 2026',
    requirement: 'Answer 100 questions correctly',
    xpReward: 200,
    category: 'learning'
  },
  {
    id: 'question-master',
    nameKey: 'Question Master',
    descriptionKey: 'Answer 500 questions correctly',
    icon: 'Award',
    emoji: '📚',
    earned: false,
    progress: 72,
    requirement: 'Answer 500 questions correctly (360/500)',
    xpReward: 500,
    category: 'learning'
  },

  // Mastery achievements
  {
    id: 'perfect-score',
    nameKey: 'gamification:achievements.perfectScore',
    descriptionKey: 'Get 100% accuracy in a practice session',
    icon: 'Star',
    emoji: '⭐',
    earned: false,
    progress: 0,
    requirement: 'Complete a session with 100% accuracy',
    xpReward: 150,
    category: 'mastery'
  },
  {
    id: 'topic-master',
    nameKey: 'gamification:badges.topicMaster',
    descriptionKey: 'Achieve 90% mastery in any topic',
    icon: 'Trophy',
    emoji: '🏆',
    earned: true,
    earnedDate: 'Feb 1, 2026',
    requirement: 'Reach 90% mastery in Propositional Logic',
    xpReward: 300,
    category: 'mastery'
  },
  {
    id: 'logic-expert',
    nameKey: 'Logic Expert',
    descriptionKey: 'Master all Logic topics',
    icon: 'BookOpen',
    emoji: '🔢',
    earned: false,
    progress: 45,
    requirement: 'Master all 4 Logic subtopics (2/4)',
    xpReward: 400,
    category: 'mastery'
  },

  // Consistency achievements
  {
    id: 'consistent-learner',
    nameKey: 'gamification:badges.consistent',
    descriptionKey: 'Practice for 7 days in a row',
    icon: 'Clock',
    emoji: '📅',
    earned: true,
    earnedDate: 'Jan 22, 2026',
    requirement: 'Practice every day for 7 consecutive days',
    xpReward: 250,
    category: 'consistency'
  },
  {
    id: 'week-warrior',
    nameKey: 'gamification:badges.weekWarrior',
    descriptionKey: 'Complete weekly goals 4 weeks in a row',
    icon: 'Award',
    emoji: '🗓️',
    earned: false,
    progress: 75,
    requirement: 'Complete weekly goals for 4 weeks (3/4)',
    xpReward: 350,
    category: 'consistency'
  },
  {
    id: 'dedicated-student',
    nameKey: 'Dedicated Student',
    descriptionKey: 'Study for 10 hours total',
    icon: 'Clock',
    emoji: '⏰',
    earned: false,
    progress: 45,
    requirement: 'Accumulate 10 hours of study time (4.5/10)',
    xpReward: 200,
    category: 'consistency'
  },

  // Special achievements
  {
    id: 'speed-demon',
    nameKey: 'gamification:badges.speedDemon',
    descriptionKey: 'Answer 10 questions correctly in under 5 minutes',
    icon: 'Zap',
    emoji: '⚡',
    earned: false,
    progress: 0,
    requirement: 'Complete Quick Session with 100% accuracy',
    xpReward: 200,
    category: 'special'
  },
  {
    id: 'no-hints',
    nameKey: 'No Help Needed',
    descriptionKey: 'Complete a session without using any hints',
    icon: 'Star',
    emoji: '💪',
    earned: true,
    earnedDate: 'Jan 30, 2026',
    requirement: 'Complete full session without hints',
    xpReward: 100,
    category: 'special'
  },
  {
    id: 'comeback-kid',
    nameKey: 'Comeback Kid',
    descriptionKey: 'Return after 3+ days and complete a session',
    icon: 'Target',
    emoji: '🔄',
    earned: false,
    progress: 0,
    requirement: 'Return after a break and practice',
    xpReward: 75,
    category: 'special'
  },
]

const categoryLabels: Record<Achievement['category'], string> = {
  learning: 'Learning',
  mastery: 'Mastery',
  consistency: 'Consistency',
  special: 'Special',
}

const categoryIcons: Record<Achievement['category'], typeof Trophy> = {
  learning: BookOpen,
  mastery: Trophy,
  consistency: Clock,
  special: Star,
}

export function AchievementsPage() {
  const { t } = useTranslation(['gamification', 'student', 'common'])

  const earnedCount = achievements.filter(a => a.earned).length
  const totalXPEarned = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.xpReward, 0)

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<Achievement['category'], Achievement[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('student:achievements')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Earn badges by completing challenges and reaching milestones
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <Trophy className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{earnedCount}/{achievements.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Achievements Earned</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalXPEarned}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('gamification:xp')} from Achievements</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{Math.round((earnedCount / achievements.length) * 100)}%</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Completion Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievement Categories */}
      {(Object.keys(groupedAchievements) as Achievement['category'][]).map((category) => {
        const CategoryIcon = categoryIcons[category]
        const categoryAchievements = groupedAchievements[category]
        const earnedInCategory = categoryAchievements.filter(a => a.earned).length

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <CategoryIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{categoryLabels[category]}</h2>
              <Badge size="sm" variant="secondary">
                {earnedInCategory}/{categoryAchievements.length}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={achievement.earned ? '' : 'opacity-75'}
                  padding="sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                      ${achievement.earned 
                        ? 'bg-accent-100 dark:bg-accent-900/30' 
                        : 'bg-neutral-100 dark:bg-neutral-800'
                      }
                    `}>
                      {achievement.earned ? achievement.emoji : <Lock className="w-5 h-5 text-neutral-400" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${achievement.earned ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {achievement.nameKey.startsWith('gamification:') 
                            ? t(achievement.nameKey) 
                            : achievement.nameKey}
                        </h3>
                        {achievement.earned && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {achievement.descriptionKey}
                      </p>

                      {/* Requirement/How earned */}
                      <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        {achievement.earned ? (
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <span className="font-medium">✓ Earned:</span> {achievement.earnedDate}
                            <br />
                            <span className="text-neutral-600 dark:text-neutral-400">{achievement.requirement}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            <span className="font-medium">How to earn:</span> {achievement.requirement}
                          </p>
                        )}
                      </div>

                      {/* Progress bar for unearned */}
                      {!achievement.earned && achievement.progress !== undefined && achievement.progress > 0 && (
                        <div className="mt-2">
                          <ProgressBar value={achievement.progress} size="sm" showLabel={false} />
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{achievement.progress}% complete</p>
                        </div>
                      )}

                      {/* XP Reward */}
                      <div className="mt-2 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent-500" />
                        <span className={`text-xs font-medium ${achievement.earned ? 'text-accent-600 dark:text-accent-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                          +{achievement.xpReward} {t('gamification:xp')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
