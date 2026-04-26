import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Trophy,
  Zap,
  Clock,
  BookOpen,
  Star,
  Award,
  CheckCircle,
  Lock,
  Binary,
  Target,
  FlaskConical,
  Beaker,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { Card, ProgressBar, Badge, Button } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { cn } from '@/utils/cn'

interface Achievement {
  id: string
  nameKey: string
  descriptionKey: string
  icon: any
  emoji: string
  earned: boolean
  earnedDate?: string
  progress?: number
  requirement: string
  xpReward: number
  category: 'learning' | 'mastery' | 'consistency' | 'special'
}

const achievements: Achievement[] = [
  {
    id: 'first-steps',
    nameKey: 'Initial Calibration',
    descriptionKey: 'Successfully completed the first diagnostic simulation.',
    icon: Target,
    emoji: '🎯',
    earned: true,
    earnedDate: 'Jan 15, 2026',
    requirement: 'Complete 1 practice session',
    xpReward: 50,
    category: 'learning',
  },
  {
    id: 'math-whiz',
    nameKey: 'Pattern Recognition',
    descriptionKey: 'Detected 100 discrete mathematical regularities.',
    icon: Zap,
    emoji: '🧮',
    earned: true,
    earnedDate: 'Jan 28, 2026',
    requirement: 'Answer 100 questions correctly',
    xpReward: 200,
    category: 'learning',
  },
  {
    id: 'question-master',
    nameKey: 'Neural Saturation',
    descriptionKey: 'Reached a state of high-density knowledge acquisition.',
    icon: Award,
    emoji: '📚',
    earned: false,
    progress: 72,
    requirement: 'Answer 500 questions correctly (360/500)',
    xpReward: 500,
    category: 'learning',
  },
  {
    id: 'perfect-score',
    nameKey: 'Absolute Precision',
    descriptionKey: 'Zero-entropy state achieved in session metrics.',
    icon: Star,
    emoji: '⭐',
    earned: false,
    progress: 0,
    requirement: 'Complete a session with 100% accuracy',
    xpReward: 150,
    category: 'mastery',
  },
  {
    id: 'topic-master',
    nameKey: 'Sector Authority',
    descriptionKey: 'Established peak speed in a knowledge sector.',
    icon: Trophy,
    emoji: '🏆',
    earned: true,
    earnedDate: 'Feb 1, 2026',
    requirement: 'Reach 90% mastery in a topic',
    xpReward: 300,
    category: 'mastery',
  },
  {
    id: 'logic-expert',
    nameKey: 'Axiomatic Mastery',
    descriptionKey: 'Total integration of logical frameworks.',
    icon: BookOpen,
    emoji: '🔢',
    earned: false,
    progress: 45,
    requirement: 'Master all subtopics in a category',
    xpReward: 400,
    category: 'mastery',
  },
  {
    id: 'consistent-learner',
    nameKey: 'Synaptic Rhythm',
    descriptionKey: 'Maintained cognitive connectivity for 7 cycles.',
    icon: Clock,
    emoji: '📅',
    earned: true,
    earnedDate: 'Jan 22, 2026',
    requirement: 'Practice for 7 consecutive days',
    xpReward: 250,
    category: 'consistency',
  },
  {
    id: 'week-warrior',
    nameKey: 'Temporal Resilience',
    descriptionKey: 'Sustained laboratory presence for a lunar cycle.',
    icon: Award,
    emoji: '🗓️',
    earned: false,
    progress: 75,
    requirement: 'Complete weekly goals for 4 weeks',
    xpReward: 350,
    category: 'consistency',
  },
]

const categoryLabels: Record<Achievement['category'], string> = {
  learning: 'Practice milestones',
  mastery: 'Mastery milestones',
  consistency: 'Consistency',
  special: 'Special unlocks',
}

const categoryIcons: Record<Achievement['category'], any> = {
  learning: Binary,
  mastery: FlaskConical,
  consistency: Clock,
  special: Star,
}

export function AchievementsPage() {
  const { t: _t } = useTranslation(['gamification', 'learner', 'common'])

  const earnedCount = achievements.filter((achievement) => achievement.earned).length
  const totalXPEarned = achievements
    .filter((achievement) => achievement.earned)
    .reduce((sum, achievement) => sum + achievement.xpReward, 0)

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<Achievement['category'], Achievement[]>)

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Milestone tracker"
        title="Achievements"
        description="A cleaner view of earned badges, in-progress rewards, and the milestones that still need a little more practice."
        icon={<Trophy className="h-6 w-6" />}
        tone="primary"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PageStatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Earned"
          value={`${earnedCount}/${achievements.length}`}
          helper="Unlocked milestones so far"
          tone="accent"
        />
        <PageStatCard
          icon={<Zap className="h-5 w-5" />}
          label="XP collected"
          value={totalXPEarned.toLocaleString()}
          helper="XP already secured from achievements"
          tone="primary"
        />
        <PageStatCard
          icon={<Beaker className="h-5 w-5" />}
          label="Completion rate"
          value={`${Math.round((earnedCount / achievements.length) * 100)}%`}
          helper="Share of the current achievement set"
          tone="success"
        />
      </div>

      {Object.entries(groupedAchievements).map(([category, items]) => {
        const typedCategory = category as Achievement['category']
        const Icon = categoryIcons[typedCategory]
        const earned = items.filter((achievement) => achievement.earned).length

        return (
          <section key={typedCategory} className="space-y-4">
            <SectionHeading
              title={categoryLabels[typedCategory]}
              description={`${earned} of ${items.length} completed`}
              action={(
                <Badge variant="outline" size="sm" className="gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {typedCategory}
                </Badge>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((achievement) => {
                const AchievementIcon = achievement.icon

                return (
                  <Card key={achievement.id} className="h-full">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-2xl',
                          achievement.earned
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
                        )}
                      >
                        {achievement.earned ? (
                          <AchievementIcon className="h-6 w-6" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">
                          {achievement.emoji}
                        </span>
                        <Badge variant={achievement.earned ? 'success' : 'outline'} size="sm">
                          {achievement.earned ? 'Earned' : 'Locked'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {achievement.nameKey}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {achievement.descriptionKey}
                      </p>
                    </div>

                    <div className="mt-5 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                      {achievement.earned ? (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Earned on {achievement.earnedDate}
                          </div>
                          <Badge variant="primary" size="sm">
                            +{achievement.xpReward} XP
                          </Badge>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Progress
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {achievement.progress ?? 0}%
                            </span>
                          </div>
                          <ProgressBar value={achievement.progress ?? 0} />
                          <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <span>{achievement.requirement}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}

      <Card className="border-primary-200 bg-primary-50/70 dark:border-primary-900/40 dark:bg-primary-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Five milestones away from the next tier
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Keep stacking sessions and strong reviews to unlock the next badge set without leaving the current visual flow of the app.
            </p>
          </div>
          <Link to="/learner/practice">
            <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
              Continue practicing
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
