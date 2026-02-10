import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Trophy,
  Medal,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  WifiOff,
  Minus,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Badge, Avatar } from '@/components/ui'

/**
 * LeaderboardPage — UC-06: View Leaderboard
 * 
 * Shows global or time-filtered rankings by total XP.
 * Highlights the current student's rank, streak, and relative standing.
 * 
 * Alternate Flows:
 * - 2a: Offline mode banner (PWA placeholder)
 * - 4a: Empty leaderboard (< 2 active students)
 */

type TimeFilter = 'week' | 'month' | 'allTime'

interface LeaderboardEntry {
  id: string
  name: string
  avatar?: string
  xp: number
  streak: number
  accuracy: number
  rank: number
  rankChange: number // positive = moved up, negative = moved down, 0 = no change
}

// Current student ID (mock — would come from auth context)
const CURRENT_STUDENT_ID = 'student-current'

export function LeaderboardPage() {
  const { t } = useTranslation(['gamification', 'common'])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')

  // UC-06 Alt Flow 2a: Offline mode simulation
  // In production, this would check navigator.onLine or a PWA service worker
  const isOffline = false
  const lastUpdated = new Date('2026-02-10T14:30:00')

  // Mock leaderboard data — varies by time filter to show different views
  const leaderboardData: Record<TimeFilter, LeaderboardEntry[]> = useMemo(() => ({
    week: [
      { id: 'student-1', name: 'أحمد محمد', xp: 1520, streak: 14, accuracy: 94, rank: 1, rankChange: 2 },
      { id: 'student-2', name: 'فاطمة علي', xp: 1380, streak: 21, accuracy: 91, rank: 2, rankChange: 0 },
      { id: 'student-3', name: 'يوسف حسن', xp: 1245, streak: 7, accuracy: 89, rank: 3, rankChange: -1 },
      { id: 'student-4', name: 'نور الدين', xp: 1120, streak: 10, accuracy: 88, rank: 4, rankChange: 1 },
      { id: 'student-5', name: 'سارة أحمد', xp: 980, streak: 5, accuracy: 87, rank: 5, rankChange: -2 },
      { id: 'student-6', name: 'محمد خالد', xp: 870, streak: 3, accuracy: 82, rank: 6, rankChange: 0 },
      { id: 'student-7', name: 'ليلى عمر', xp: 750, streak: 8, accuracy: 80, rank: 7, rankChange: 3 },
      { id: 'student-8', name: 'عمر حسين', xp: 620, streak: 2, accuracy: 76, rank: 8, rankChange: -1 },
      { id: 'student-9', name: 'هدى سعيد', xp: 510, streak: 4, accuracy: 73, rank: 9, rankChange: 0 },
      { id: 'student-10', name: 'كريم أنور', xp: 440, streak: 1, accuracy: 70, rank: 10, rankChange: -2 },
      // Current student outside top 10
      { id: CURRENT_STUDENT_ID, name: 'طالب حالي', xp: 385, streak: 6, accuracy: 78, rank: 14, rankChange: 1 },
    ],
    month: [
      { id: 'student-2', name: 'فاطمة علي', xp: 5820, streak: 21, accuracy: 91, rank: 1, rankChange: 1 },
      { id: 'student-1', name: 'أحمد محمد', xp: 5640, streak: 14, accuracy: 94, rank: 2, rankChange: -1 },
      { id: 'student-3', name: 'يوسف حسن', xp: 4890, streak: 7, accuracy: 89, rank: 3, rankChange: 0 },
      { id: CURRENT_STUDENT_ID, name: 'طالب حالي', xp: 4210, streak: 6, accuracy: 78, rank: 4, rankChange: 3 },
      { id: 'student-4', name: 'نور الدين', xp: 3950, streak: 10, accuracy: 88, rank: 5, rankChange: -1 },
      { id: 'student-7', name: 'ليلى عمر', xp: 3780, streak: 8, accuracy: 80, rank: 6, rankChange: 1 },
      { id: 'student-5', name: 'سارة أحمد', xp: 3540, streak: 5, accuracy: 87, rank: 7, rankChange: -2 },
      { id: 'student-6', name: 'محمد خالد', xp: 3120, streak: 3, accuracy: 82, rank: 8, rankChange: -2 },
      { id: 'student-9', name: 'هدى سعيد', xp: 2870, streak: 4, accuracy: 73, rank: 9, rankChange: 0 },
      { id: 'student-8', name: 'عمر حسين', xp: 2650, streak: 2, accuracy: 76, rank: 10, rankChange: -2 },
    ],
    // UC-06 Alt Flow 4a: Empty leaderboard — set to empty array to test
    // To test: change to [] 
    allTime: [
      { id: 'student-1', name: 'أحمد محمد', xp: 24520, streak: 14, accuracy: 94, rank: 1, rankChange: 0 },
      { id: 'student-2', name: 'فاطمة علي', xp: 22380, streak: 21, accuracy: 91, rank: 2, rankChange: 0 },
      { id: 'student-3', name: 'يوسف حسن', xp: 19245, streak: 7, accuracy: 89, rank: 3, rankChange: 0 },
      { id: 'student-4', name: 'نور الدين', xp: 17120, streak: 10, accuracy: 88, rank: 4, rankChange: 0 },
      { id: 'student-5', name: 'سارة أحمد', xp: 15980, streak: 5, accuracy: 87, rank: 5, rankChange: 0 },
      { id: 'student-7', name: 'ليلى عمر', xp: 14750, streak: 8, accuracy: 80, rank: 6, rankChange: 0 },
      { id: 'student-6', name: 'محمد خالد', xp: 13870, streak: 3, accuracy: 82, rank: 7, rankChange: 0 },
      { id: 'student-8', name: 'عمر حسين', xp: 11620, streak: 2, accuracy: 76, rank: 8, rankChange: 0 },
      { id: CURRENT_STUDENT_ID, name: 'طالب حالي', xp: 10385, streak: 6, accuracy: 78, rank: 9, rankChange: 2 },
      { id: 'student-9', name: 'هدى سعيد', xp: 9510, streak: 4, accuracy: 73, rank: 10, rankChange: -1 },
    ],
  }), [])

  const entries = leaderboardData[timeFilter]
  const topEntries = entries.filter(e => e.id !== CURRENT_STUDENT_ID).slice(0, 10)
  const currentStudent = entries.find(e => e.id === CURRENT_STUDENT_ID)
  const isCurrentInTop10 = topEntries.some(e => e.id === CURRENT_STUDENT_ID) || 
                           (currentStudent && currentStudent.rank <= 10)
  const hasEnoughStudents = entries.length >= 2

  // Insert current student in the right position if they're in the top 10
  const displayEntries = useMemo(() => {
    const allSorted = [...entries].sort((a, b) => a.rank - b.rank)
    return allSorted.filter(e => e.rank <= 10)
  }, [entries])

  const filters: { key: TimeFilter; labelKey: string }[] = [
    { key: 'week', labelKey: 'gamification:thisWeek' },
    { key: 'month', labelKey: 'gamification:thisMonth' },
    { key: 'allTime', labelKey: 'gamification:allTime' },
  ]

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-neutral-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    if (rank === 2) return 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
    if (rank === 3) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    return 'border-transparent'
  }

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-neutral-400" />
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* UC-06 Alt Flow 2a: Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          <WifiOff className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">{t('gamification:offlineMode')}</p>
            <p className="text-amber-600 dark:text-amber-300">
              {t('gamification:lastUpdated', { time: lastUpdated.toLocaleString() })}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('gamification:leaderboard')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          {t('gamification:leaderboardDescription')}
        </p>
      </div>

      {/* Time Filters — UC-06 Step 5 */}
      <div className="flex justify-center gap-2">
        {filters.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => !isOffline && setTimeFilter(key)}
            disabled={isOffline}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeFilter === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            } ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Current Student Card — UC-06 Step 4: Always visible */}
      {currentStudent && hasEnoughStudents && (
        <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="text-center min-w-12">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">#{currentStudent.rank}</p>
                <div className="flex items-center justify-center">
                  {getRankChangeIcon(currentStudent.rankChange)}
                </div>
              </div>
              <Avatar name={currentStudent.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                  {currentStudent.name}
                  <Badge variant="primary" size="sm" className="ms-2">{t('gamification:you')}</Badge>
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-primary-600 dark:text-primary-400">
                    {currentStudent.xp.toLocaleString()} {t('gamification:xp')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    {t('gamification:streakDays', { count: currentStudent.streak })}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <Badge variant="secondary">{currentStudent.accuracy}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard List */}
      {!hasEnoughStudents ? (
        /* UC-06 Alt Flow 4a: Empty leaderboard */
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              {t('gamification:emptyLeaderboard')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              {t('gamification:beFirstToClaim')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={t('gamification:topPerformers')}
            subtitle={t('gamification:topPerformersSubtitle')}
          />
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {displayEntries.map((entry) => {
                const isCurrent = entry.id === CURRENT_STUDENT_ID
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors ${getRankStyle(entry.rank)} ${
                      isCurrent ? 'bg-primary-50/60 dark:bg-primary-900/20 border-s-4 border-s-primary-500' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 text-center">
                      {getRankIcon(entry.rank) || (
                        <span className="text-lg font-bold text-neutral-500 dark:text-neutral-400">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Rank change */}
                    <div className="w-6 flex justify-center">
                      {getRankChangeIcon(entry.rankChange)}
                    </div>

                    {/* Avatar + Name */}
                    <Avatar name={entry.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        isCurrent 
                          ? 'text-primary-700 dark:text-primary-300' 
                          : 'text-neutral-800 dark:text-neutral-100'
                      }`}>
                        {entry.name}
                        {isCurrent && (
                          <Badge variant="primary" size="sm" className="ms-2">{t('gamification:you')}</Badge>
                        )}
                      </p>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>{entry.streak}</span>
                    </div>

                    {/* XP */}
                    <div className="text-end min-w-16">
                      <p className="font-bold text-neutral-800 dark:text-neutral-100">
                        {entry.xp.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('gamification:xp')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show current student separately if outside top 10 */}
      {currentStudent && !isCurrentInTop10 && currentStudent.rank > 10 && hasEnoughStudents && (
        <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>···</p>
          <p className="mt-1">{t('gamification:yourRankPosition', { rank: currentStudent.rank })}</p>
        </div>
      )}
    </div>
  )
}
