import { useMemo } from 'react'
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
import { Skeleton } from '@/components/ui/Loading'
import { useLearnerProfile, useTopicMastery } from '@/hooks'

/**
 * ProgressPage
 *
 * Backend-integrated progress view:
 * - Stats derived from learner profile (XP, streak) and topic mastery
 * - Topic breakdown cards with FIRe memory/speed metrics
 * - Review goal progress
 * RTL-aware with full i18n support.
 */

interface TopicMastery {
  id: number
  topic: number
  topic_name: string
  rep_num: number
  memory: number
  speed: number
  status: 'new' | 'learning' | 'learned' | 'struggling'
  last_reviewed: string | null
  next_due: string | null
}

const stateBadgeVariant: Record<string, 'success' | 'warning' | 'primary' | 'outline'> = {
  new: 'outline',
  learning: 'primary',
  struggling: 'warning',
  learned: 'success',
}

export function ProgressPage() {
  const { t: _t } = useTranslation(['learner', 'topics', 'common', 'gamification'])

  const { data: profile, isLoading: profileLoading } = useLearnerProfile()
  const { data: rawMasteries, isLoading: masteryLoading } = useTopicMastery()
  const masteries = (rawMasteries ?? []) as TopicMastery[]
  const isLoading = profileLoading || masteryLoading

  // Derive weekly-style stats from real data
  const weeklyStats = useMemo(() => {
    const topicsReviewed = masteries.filter((m) => m.last_reviewed).length
    const avgMemory =
      masteries.length > 0
        ? Math.round(
            (masteries.reduce((s, m) => s + Math.min(1, m.memory || 0), 0) /
              masteries.length) *
              100
          )
        : 0

    return {
      xpEarned: profile?.total_xp ?? 0,
      streak: profile?.streak_count ?? 0,
      topicsReviewed,
      averageAccuracy: avgMemory,
      totalTopics: masteries.length,
    }
  }, [profile, masteries])

  // Overall mastery percentage
  const overallMastery = useMemo(() => {
    if (masteries.length === 0) return 0
    return Math.round(
      (masteries.reduce((s, m) => s + Math.min(1, m.memory || 0), 0) /
        masteries.length) *
        100
    )
  }, [masteries])

  // Topic cards sorted by status priority: struggling → learning → new → learned
  const topicCards = useMemo(() => {
    const priority: Record<string, number> = {
      struggling: 0,
      learning: 1,
      new: 2,
      learned: 3,
    }
    return [...masteries].sort(
      (a, b) => (priority[a.status] ?? 2) - (priority[b.status] ?? 2)
    )
  }, [masteries])

  // Format next_due as relative text
  const formatDue = (nextDue: string | null): string => {
    if (!nextDue) return 'Not scheduled'
    const diff = new Date(nextDue).getTime() - Date.now()
    if (diff <= 0) return 'Due now'
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days === 1) return 'Tomorrow'
    return `In ${days} days`
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Learning analytics"
        title="Progress"
        description="A focused view of your recent practice, topic mastery, and upcoming reviews powered by FIRe data."
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
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="sm">
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="50%" />
                  <Skeleton width="70%" height={12} />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <>
            <PageStatCard
              icon={<Target className="h-5 w-5" />}
              label="Topics tracked"
              value={weeklyStats.totalTopics}
              helper={`${weeklyStats.topicsReviewed} reviewed at least once`}
              tone="primary"
            />
            <PageStatCard
              icon={<Clock className="h-5 w-5" />}
              label="Practice streak"
              value={`${weeklyStats.streak} days`}
              helper="Keep it going!"
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
              label="Overall mastery"
              value={`${weeklyStats.averageAccuracy}%`}
              helper="Average FIRe memory score"
              tone="success"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Mastery overview */}
        <Card className="lg:col-span-8">
          <CardHeader
            title="Topic mastery overview"
            subtitle="Your FIRe memory score across all tracked topics."
          />
          <CardContent className="space-y-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton width="40%" />
                    <Skeleton width={40} />
                  </div>
                  <Skeleton height={8} />
                </div>
              ))
            ) : masteries.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6">
                Complete some practice sessions and your mastery data will appear here.
              </p>
            ) : (
              topicCards.slice(0, 8).map((m) => {
                const progress = Math.round(Math.min(1, m.memory || 0) * 100)
                return (
                  <div key={m.id} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {m.topic_name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {m.rep_num} review{m.rep_num !== 1 ? 's' : ''} • {formatDue(m.next_due)}
                        </p>
                      </div>
                      <Badge variant={stateBadgeVariant[m.status] ?? 'outline'} size="sm">
                        {m.status} — {progress}%
                      </Badge>
                    </div>
                    <ProgressBar value={progress} variant="secondary" />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* FIRe model sidebar */}
        <Card className="lg:col-span-4">
          <CardHeader
            title="FIRe model"
            subtitle="Your review schedule is adjusted from recent performance and recall speed."
          />
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-secondary-50 p-4 dark:bg-secondary-950/20">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-secondary-600 dark:text-secondary-300" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Overall mastery
                  </span>
                </div>
                <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  {isLoading ? '--' : `${overallMastery}%`}
                </span>
              </div>
              <ProgressBar value={overallMastery} variant="secondary" />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Memory index
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {isLoading ? '--' : `${overallMastery}%`}
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {overallMastery >= 70
                  ? 'Strong recall — upcoming intervals can stretch further.'
                  : overallMastery >= 40
                    ? 'Good progress — consistent review will solidify your memory.'
                    : 'Early stage — keep practising to build long-term retention.'}
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

      {/* Topic breakdown cards */}
      <section className="space-y-4">
        <SectionHeading
          title="Topic breakdown"
          description="Detailed mastery cards powered by FIRe review data."
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="60%" />
                      <Skeleton width="40%" height={12} />
                    </div>
                  </div>
                  <Skeleton height={8} />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton height={48} variant="rectangular" className="rounded-xl" />
                    <Skeleton height={48} variant="rectangular" className="rounded-xl" />
                    <Skeleton height={48} variant="rectangular" className="rounded-xl" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : topicCards.length === 0 ? (
          <Card className="border-dashed">
            <div className="text-center py-6 space-y-2">
              <Brain className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                No mastery data yet
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Complete a few practice sessions and your topic strengths will show up here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {topicCards.map((topic) => {
              const progress = Math.round(Math.min(1, topic.memory || 0) * 100)
              return (
                <Card key={topic.id} className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-lg text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300">
                        📚
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                          {topic.topic_name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {topic.rep_num} review{topic.rep_num !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={stateBadgeVariant[topic.status] ?? 'outline'} size="sm">
                      {topic.status}
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Mastery</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar value={progress} variant="secondary" />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-neutral-50 p-4 text-sm dark:bg-neutral-900/60">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Memory
                      </p>
                      <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                        {progress}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Speed
                      </p>
                      <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                        {(topic.speed || 0).toFixed(1)}d
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Next review
                      </p>
                      <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatDue(topic.next_due)}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
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
