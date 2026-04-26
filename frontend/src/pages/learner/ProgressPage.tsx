import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Target,
  Clock,
  Brain,
  Zap,
  Activity,
  History,
  ArrowRight,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Badge, Button } from '@/components/ui'
import { ProgressBar } from '@/components/ui/Progress'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'

interface TopicProgress {
  id: string
  nameKey: string
  icon: string
  mastery: number
  questionsAnswered: number
  questionsTotal: number
  speed: number
  nextReview: string
  state: 'new' | 'learning' | 'review' | 'mastered'
}

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

const topicProgressList: TopicProgress[] = [
  {
    id: '1',
    nameKey: 'Propositional Logic',
    icon: '→',
    mastery: 85,
    questionsAnswered: 45,
    questionsTotal: 50,
    speed: 14.5,
    nextReview: 'In 3 days',
    state: 'mastered',
  },
  {
    id: '2',
    nameKey: 'Set Operations',
    icon: '∩',
    mastery: 72,
    questionsAnswered: 32,
    questionsTotal: 45,
    speed: 7.2,
    nextReview: 'Tomorrow',
    state: 'review',
  },
  {
    id: '3',
    nameKey: 'Equivalence Relations',
    icon: '~',
    mastery: 45,
    questionsAnswered: 18,
    questionsTotal: 40,
    speed: 2.1,
    nextReview: 'Today',
    state: 'learning',
  },
]

const stateBadgeVariant: Record<TopicProgress['state'], 'success' | 'warning' | 'primary' | 'outline'> = {
  new: 'outline',
  learning: 'primary',
  review: 'warning',
  mastered: 'success',
}

export function ProgressPage() {
  const { t: _t } = useTranslation(['learner', 'topics', 'common', 'gamification'])

  const reviewGoalProgress = Math.min(
    100,
    Math.round((weeklyStats.questionsAnswered / 100) * 100),
  )

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Learning analytics"
        title="Progress"
        description="A focused view of your recent practice, topic mastery, and upcoming reviews without the oversized dashboard treatment."
        icon={<Activity className="h-6 w-6" />}
        tone="secondary"
        actions={(
          <Link to="/learner/topics">
            <Button
              variant="outline"
              rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
            >
              Review topics
            </Button>
          </Link>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          icon={<Target className="h-5 w-5" />}
          label="Questions answered"
          value={weeklyStats.questionsAnswered}
          helper={`${weeklyStats.questionsCorrect} correct this week`}
          tone="primary"
        />
        <PageStatCard
          icon={<Clock className="h-5 w-5" />}
          label="Study time"
          value={weeklyStats.timeSpent}
          helper="Tracked across recent sessions"
          tone="accent"
        />
        <PageStatCard
          icon={<Zap className="h-5 w-5" />}
          label="XP earned"
          value={weeklyStats.xpEarned.toLocaleString()}
          helper="From review and practice sessions"
          tone="secondary"
        />
        <PageStatCard
          icon={<Activity className="h-5 w-5" />}
          label="Topics reviewed"
          value={weeklyStats.topicsReviewed}
          helper={`${weeklyStats.averageAccuracy}% average accuracy`}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Monthly activity"
            subtitle="A simple snapshot of how much practice you completed each week."
          />
          <CardContent className="space-y-5">
            {monthlyProgress.map((week) => (
              <div key={week.week} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {week.week}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {week.questions} questions completed
                    </p>
                  </div>
                  <Badge variant="secondary" size="sm">
                    {week.accuracy}% accuracy
                  </Badge>
                </div>
                <ProgressBar value={week.questions} max={90} variant="secondary" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader
            title="FIRe model"
            subtitle="Your review schedule is being adjusted from recent performance and recall speed."
          />
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-secondary-50 p-4 dark:bg-secondary-950/20">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-secondary-600 dark:text-secondary-300" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Weekly review goal
                  </span>
                </div>
                <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  {reviewGoalProgress}%
                </span>
              </div>
              <ProgressBar value={reviewGoalProgress} variant="secondary" />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Accuracy trend
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {weeklyStats.averageAccuracy}%
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                You are staying above your recent baseline, so upcoming intervals can stretch a little further.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                <History className="h-4 w-4 text-neutral-500" />
                Review pacing note
              </div>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Lower-speed topics should be revisited first. That keeps your queue manageable and protects your stronger topics from slipping.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <SectionHeading
          title="Topic breakdown"
          description="The same topic cards, but sized closer to the rest of the product."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {topicProgressList.map((topic) => (
            <Card key={topic.id} className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-lg text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300">
                    {topic.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {topic.nameKey}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Topic #{topic.id}
                    </p>
                  </div>
                </div>
                <Badge variant={stateBadgeVariant[topic.state]} size="sm">
                  {topic.state}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Mastery</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {topic.mastery}%
                  </span>
                </div>
                <ProgressBar value={topic.mastery} variant="secondary" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-neutral-50 p-4 text-sm dark:bg-neutral-900/60">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    Answered
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {topic.questionsAnswered}/{topic.questionsTotal}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    Review speed
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {topic.speed}d
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    Next review
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {topic.nextReview}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-secondary-200 bg-secondary-50/70 dark:border-secondary-900/40 dark:bg-secondary-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Keep your queue healthy
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Your best next step is to review the topics with the lowest speed score before starting a brand-new session.
            </p>
          </div>
          <Link to="/learner/practice">
            <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
              Start practice
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
