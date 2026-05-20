import { useState, useMemo, Suspense } from 'react'
import {
  Medal,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  WifiOff,
  Search,
  Users,
  TrendingUp,
} from 'lucide-react'
import { Card, Badge, Avatar, ProgressBar, Button, Input, Skeleton } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { useCurrentUser } from '@/contexts'
import { useSuspenseTopics, useSuspenseGlobalLeaderboard, useSuspenseTopicLeaderboard } from '@/hooks'
import { cn } from '@/utils/cn'
import type { LeaderboardLearner } from '@/services/learners'

interface LeaderboardEntry {
  id: number | string
  name: string
  avatar?: string
  xp: number
  streak: number
  accuracy: number
  rank: number
  rank_change: number
  is_current_user?: boolean
}

interface TopicOption {
  id: number | string
  name: string
}

interface LeaderboardApiEntry extends LeaderboardLearner {
  accuracy?: number
  rank_change?: number
}

interface LeaderboardDisplayProps {
  leaderboardType: 'global' | 'topic'
  selectedTopicName?: string
  currentUserEntry: LeaderboardEntry | null
  displayEntries: LeaderboardEntry[]
  averageAccuracy: number
  longestStreak: number
  searchQuery: string
  setSearchQuery: (query: string) => void
}

function LeaderboardPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Intro Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Layout (Left Column & Right Column) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column - Your Position */}
        <div className="space-y-4 lg:col-span-4">
          <Skeleton className="h-6 w-32" />
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={64} height={64} />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2 mt-1">
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </Card>
        </div>

        {/* Right Column - Standings */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-48 rounded-lg" />
          </div>

          <Card padding="none" className="overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4 flex-grow">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="space-y-2 flex-grow max-w-xs">
                    <Skeleton className="h-4.5 w-32" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 md:min-w-[320px]">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4.5 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4.5 w-10" />
                  </div>
                  <div className="space-y-1 text-end">
                    <Skeleton className="h-3 w-16 ms-auto" />
                    <Skeleton className="h-4.5 w-12 ms-auto" />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

export function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardPageSkeleton />}>
      <LeaderboardContent />
    </Suspense>
  )
}

function LeaderboardContent() {
  const currentUser = useCurrentUser()
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'topic'>('global')
  const [selectedTopicOverride, setSelectedTopicOverride] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch topics for the filter dropdown
  const { data: rawTopics } = useSuspenseTopics()
  const topics = useMemo(
    () => (rawTopics ?? []) as TopicOption[],
    [rawTopics]
  )
  const selectedTopicId = selectedTopicOverride || topics[0]?.id.toString() || ''
  const selectedTopicName = useMemo(() => {
    return topics.find((topic) => String(topic.id) === selectedTopicId)?.name ?? 'Selected topic'
  }, [topics, selectedTopicId])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Leaderboard"
        title="Hall of fame"
        description="A cleaner ranking view that keeps the competitive feel without the oversized full-screen layout."
        icon={<Crown className="h-6 w-6" />}
        tone="accent"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {(['global', 'topic'] as const).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={leaderboardType === type ? 'accent' : 'outline'}
                onClick={() => setLeaderboardType(type)}
              >
                {type === 'global' ? 'Global' : 'By topic'}
              </Button>
            ))}

            {leaderboardType === 'topic' && (
              <select
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicOverride(event.target.value)}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      />

      <Suspense fallback={<LeaderboardPageSkeleton />}>
        {leaderboardType === 'global' ? (
          <GlobalLeaderboardSection
            currentUser={currentUser}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        ) : (
          <TopicLeaderboardSection
            topicId={selectedTopicId}
            selectedTopicName={selectedTopicName}
            currentUser={currentUser}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </Suspense>
    </div>
  )
}

function GlobalLeaderboardSection({
  currentUser,
  searchQuery,
  setSearchQuery,
}: {
  currentUser: any
  searchQuery: string
  setSearchQuery: (query: string) => void
}) {
  const { data: globalData } = useSuspenseGlobalLeaderboard()

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    return ((globalData ?? []) as LeaderboardApiEntry[]).map((entry, index) => ({
      id: entry.id,
      name: entry.user ? `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.username : 'Unknown learner',
      xp: entry.total_xp || 0,
      streak: entry.streak_count || 0,
      accuracy: entry.accuracy || 100,
      rank: index + 1,
      rank_change: entry.rank_change || 0,
      is_current_user: String(entry.user?.id) === String(currentUser.id),
    }))
  }, [globalData, currentUser.id])

  const currentUserEntry = useMemo(
    () => leaderboard.find((entry) => entry.is_current_user) || null,
    [leaderboard]
  )

  const displayEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const filteredEntries = normalizedQuery
      ? leaderboard.filter((entry) => {
          return (
            entry.name.toLowerCase().includes(normalizedQuery) ||
            String(entry.id).toLowerCase().includes(normalizedQuery)
          )
        })
      : leaderboard

    return filteredEntries.slice(0, 10).sort((a, b) => a.rank - b.rank)
  }, [leaderboard, searchQuery])

  const averageAccuracy = useMemo(() => {
    if (displayEntries.length === 0) return 0

    return Math.round(
      displayEntries.reduce((sum, entry) => sum + entry.accuracy, 0) / displayEntries.length,
    )
  }, [displayEntries])

  const longestStreak = useMemo(() => {
    return leaderboard.reduce((highest, entry) => Math.max(highest, entry.streak), 0)
  }, [leaderboard])

  return (
    <LeaderboardDisplay
      leaderboardType="global"
      currentUserEntry={currentUserEntry}
      displayEntries={displayEntries}
      averageAccuracy={averageAccuracy}
      longestStreak={longestStreak}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      totalCount={displayEntries.length}
    />
  )
}

function TopicLeaderboardSection({
  topicId,
  selectedTopicName,
  currentUser,
  searchQuery,
  setSearchQuery,
}: {
  topicId: string
  selectedTopicName: string
  currentUser: any
  searchQuery: string
  setSearchQuery: (query: string) => void
}) {
  const { data: topicData } = useSuspenseTopicLeaderboard(topicId)

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    return ((topicData ?? []) as LeaderboardApiEntry[]).map((entry, index) => ({
      id: entry.id,
      name: entry.user ? `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.username : 'Unknown learner',
      xp: entry.total_xp || 0,
      streak: entry.streak_count || 0,
      accuracy: entry.accuracy || 100,
      rank: index + 1,
      rank_change: entry.rank_change || 0,
      is_current_user: String(entry.user?.id) === String(currentUser.id),
    }))
  }, [topicData, currentUser.id])

  const currentUserEntry = useMemo(
    () => leaderboard.find((entry) => entry.is_current_user) || null,
    [leaderboard]
  )

  const displayEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const filteredEntries = normalizedQuery
      ? leaderboard.filter((entry) => {
          return (
            entry.name.toLowerCase().includes(normalizedQuery) ||
            String(entry.id).toLowerCase().includes(normalizedQuery)
          )
        })
      : leaderboard

    return filteredEntries.slice(0, 10).sort((a, b) => a.rank - b.rank)
  }, [leaderboard, searchQuery])

  const averageAccuracy = useMemo(() => {
    if (displayEntries.length === 0) return 0

    return Math.round(
      displayEntries.reduce((sum, entry) => sum + entry.accuracy, 0) / displayEntries.length,
    )
  }, [displayEntries])

  const longestStreak = useMemo(() => {
    return leaderboard.reduce((highest, entry) => Math.max(highest, entry.streak), 0)
  }, [leaderboard])

  return (
    <LeaderboardDisplay
      leaderboardType="topic"
      selectedTopicName={selectedTopicName}
      currentUserEntry={currentUserEntry}
      displayEntries={displayEntries}
      averageAccuracy={averageAccuracy}
      longestStreak={longestStreak}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      totalCount={displayEntries.length}
    />
  )
}

function LeaderboardDisplay({
  leaderboardType,
  selectedTopicName,
  currentUserEntry,
  displayEntries,
  averageAccuracy,
  longestStreak,
  searchQuery,
  setSearchQuery,
  totalCount,
}: LeaderboardDisplayProps & { totalCount: number }) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-neutral-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PageStatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Your rank"
          value={currentUserEntry ? `#${currentUserEntry.rank}` : '--'}
          helper={currentUserEntry ? `${currentUserEntry.xp.toLocaleString()} XP` : 'Join a session to appear'}
          tone="accent"
        />
        <PageStatCard
          icon={<Users className="h-5 w-5" />}
          label="Visible entries"
          value={totalCount}
          helper={leaderboardType === 'topic' ? selectedTopicName : 'Current top results'}
          tone="primary"
        />
        <PageStatCard
          icon={<Search className="h-5 w-5" />}
          label="Average accuracy"
          value={`${averageAccuracy}%`}
          helper="Across the current result set"
          tone="success"
        />
        <PageStatCard
          icon={<Flame className="h-5 w-5" />}
          label="Longest streak"
          value={longestStreak}
          helper="Best streak in the fetched standings"
          tone="secondary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <SectionHeading
            title="Your position"
            description="A compact summary of how you compare with the current board."
          />

          <Card className="h-full">
            {currentUserEntry ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar name={currentUserEntry.name} size="xl" />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {currentUserEntry.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="accent" size="sm">
                        Rank #{currentUserEntry.rank}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {currentUserEntry.xp.toLocaleString()} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                      Streak
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {currentUserEntry.streak}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                      Rank change
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      {currentUserEntry.rank_change >= 0 ? (
                        <ChevronUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-rose-500" />
                      )}
                      {Math.abs(currentUserEntry.rank_change)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Accuracy</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {currentUserEntry.accuracy}%
                    </span>
                  </div>
                  <ProgressBar value={currentUserEntry.accuracy} variant="success" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <WifiOff className="h-8 w-8 text-neutral-400" />
                <div className="space-y-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    No current rank yet
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Complete more practice to appear in the leaderboard.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-8">
          <SectionHeading
            title={leaderboardType === 'global' ? 'Top learners' : `${selectedTopicName} leaderboard`}
            description="Search by learner name or visible entry id."
            action={(
              <div className="w-full sm:w-64">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search learners"
                  leftIcon={<Search className="h-4 w-4" />}
                  size="sm"
                />
              </div>
            )}
          />

          <Card padding="none" className="overflow-hidden">
            {displayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Search className="h-8 w-8 text-neutral-400" />
                <div className="space-y-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    No matching entries
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Try a different learner name or clear the search filter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {displayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex flex-col gap-4 px-4 py-4 sm:px-6',
                      'md:flex-row md:items-center md:justify-between',
                      entry.is_current_user && 'bg-primary-50/70 dark:bg-primary-950/20',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        {getRankIcon(entry.rank) || (
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={entry.name} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                            {entry.name}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Entry ID {entry.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:min-w-[320px]">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                          XP
                        </p>
                        <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                          {entry.xp.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                          Streak
                        </p>
                        <p className="mt-1 flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                          <Flame className="h-4 w-4 text-orange-500" />
                          {entry.streak}
                        </p>
                      </div>
                      <div className="text-start md:text-end">
                        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                          Accuracy
                        </p>
                        <div className="mt-1 flex items-center gap-2 md:justify-end">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {entry.accuracy}%
                          </span>
                          {entry.is_current_user && (
                            <Badge variant="primary" size="sm">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
