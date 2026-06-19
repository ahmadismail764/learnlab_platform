import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { learnersService, type LearnerProfile, type LeaderboardLearner } from '@/services/learners'
import { topicsService } from '@/services/topics'
import {
  analyticsService,
  type AggregatedMetricsResponse,
  type BulkTopicAnalyticsResponse,
  type ActivityTimeSeriesResponse,
  type DifficultyTierBreakdownResponse,
} from '@/services/analytics'
import { practiceService } from '@/services/practice'
import { authService, type UpdateCurrentUserPayload } from '@/services/auth'
import {
  adminsService,
  type AuditLogEntry,
  type SystemHealthResponse,
} from '@/services/admins'

/**
 * Centralized data-fetching hooks
 *
 * Wraps existing service calls with React Query for:
 * - Automatic caching & deduplication (same endpoint won't fire twice)
 * - Background refetching when data goes stale
 * - Loading / error states without manual useState
 * - Cache invalidation on mutations
 *
 * Query key convention:  ['domain', 'resource', ...params]
 */

// ── Query Keys ────────────────────────────────────────────────────
// Centralized so invalidation is consistent across the app.
export const queryKeys = {
  learner: {
    profile: ['learner', 'profile'] as const,
    mastery: ['learner', 'mastery'] as const,
  },
  leaderboard: {
    global: ['leaderboard', 'global'] as const,
    topic: (topicId: string | number) => ['leaderboard', 'topic', topicId] as const,
  },
  topics: {
    list: ['topics', 'list'] as const,
    detail: (id: string | number) => ['topics', 'detail', id] as const,
  },
  questions: {
    list: ['questions', 'list'] as const,
  },
  analytics: {
    aggregated: ['analytics', 'aggregated'] as const,
    bulk: ['analytics', 'bulk'] as const,
    activity: (period?: string) => ['analytics', 'activity', period] as const,
    difficulty: ['analytics', 'difficulty'] as const,
  },
  admin: {
    auditLogs: ['admin', 'auditLogs'] as const,
    systemHealth: ['admin', 'systemHealth'] as const,
  },
  practice: {
    sessions: ['practice', 'sessions'] as const,
    session: (id: string | number) => ['practice', 'session', id] as const,
  },
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
} as const

// ── Learner Hooks ─────────────────────────────────────────────────

/** Fetch the current learner's profile (XP, streak, etc.) */
export function useLearnerProfile() {
  return useQuery<LearnerProfile>({
    queryKey: queryKeys.learner.profile,
    queryFn: () => learnersService.getCurrentProfile(),
  })
}

/** Fetch normalized FSRS mastery data (retrievability/stability/status per topic) */
export function useTopicMastery() {
  return useQuery({
    queryKey: queryKeys.learner.mastery,
    queryFn: () => topicsService.getTopicMastery(),
  })
}

// ── Leaderboard Hooks ─────────────────────────────────────────────

/** Fetch the global leaderboard */
export function useGlobalLeaderboard() {
  return useQuery<LeaderboardLearner[]>({
    queryKey: queryKeys.leaderboard.global,
    queryFn: () => learnersService.getLeaderboard(),
  })
}

/** Fetch a topic-specific leaderboard */
export function useTopicLeaderboard(topicId: string | number | null) {
  return useQuery<LeaderboardLearner[]>({
    queryKey: queryKeys.leaderboard.topic(topicId ?? ''),
    queryFn: () => learnersService.getTopicLeaderboard(topicId!),
    enabled: topicId != null,
  })
}

// ── Topics & Questions Hooks ────────────────────────────────────────

/** Fetch all topics */
export function useTopics() {
  return useQuery({
    queryKey: queryKeys.topics.list,
    queryFn: () => topicsService.getTopics(),
  })
}

/** Fetch all questions */
export function useQuestions() {
  return useQuery({
    queryKey: queryKeys.questions.list,
    queryFn: async () => {
      const { questionsService } = await import('@/services/questions')
      return await questionsService.getQuestions()
    },
  })
}

/** Suspense version to fetch the global leaderboard */
export function useSuspenseGlobalLeaderboard() {
  return useSuspenseQuery<LeaderboardLearner[]>({
    queryKey: queryKeys.leaderboard.global,
    queryFn: () => learnersService.getLeaderboard(),
  })
}

export function useSuspenseTopicLeaderboard(topicId: string | number) {
  return useSuspenseQuery<LeaderboardLearner[]>({
    queryKey: queryKeys.leaderboard.topic(topicId),
    queryFn: () => learnersService.getTopicLeaderboard(topicId),
  })
}

/** Suspense version to fetch all topics */
export function useSuspenseTopics() {
  return useSuspenseQuery({
    queryKey: queryKeys.topics.list,
    queryFn: () => topicsService.getTopics(),
  })
}

/** Suspense version to fetch all questions */
export function useSuspenseQuestions() {
  return useSuspenseQuery({
    queryKey: queryKeys.questions.list,
    queryFn: async () => {
      const { questionsService } = await import('@/services/questions')
      return await questionsService.getQuestions()
    },
  })
}

// ── Analytics Hooks ───────────────────────────────────────────────

/** Fetch aggregated analytics metrics (admin) */
export function useAggregatedMetrics() {
  return useQuery<AggregatedMetricsResponse>({
    queryKey: queryKeys.analytics.aggregated,
    queryFn: () => analyticsService.getAggregatedMetrics(),
    retry: false,
  })
}

/** Fetch bulk topic performance analytics (admin) */
export function useBulkTopicAnalytics() {
  return useQuery<BulkTopicAnalyticsResponse>({
    queryKey: queryKeys.analytics.bulk,
    queryFn: () => analyticsService.getBulkTopicAnalytics(),
    retry: false,
  })
}

/** Fetch historical learner activity time-series (admin) */
export function useActivityTimeSeries(period?: string) {
  return useQuery<ActivityTimeSeriesResponse>({
    queryKey: queryKeys.analytics.activity(period),
    queryFn: () => analyticsService.getActivityTimeSeries(period),
    retry: false,
  })
}

/** Fetch curriculum difficulty tier breakdown (admin) */
export function useDifficultyBreakdown() {
  return useQuery<DifficultyTierBreakdownResponse>({
    queryKey: queryKeys.analytics.difficulty,
    queryFn: () => analyticsService.getDifficultyBreakdown(),
    retry: false,
  })
}

// ── Admin Operations Hooks ───────────────────────────────────────

/** Fetch recent admin audit trail entries */
export function useAuditLogs() {
  return useQuery<AuditLogEntry[]>({
    queryKey: queryKeys.admin.auditLogs,
    queryFn: () => adminsService.getAuditLogs(),
  })
}

/** Fetch backend operational telemetry */
export function useSystemHealth() {
  return useQuery<SystemHealthResponse>({
    queryKey: queryKeys.admin.systemHealth,
    queryFn: () => adminsService.getSystemHealth(),
  })
}

// ── Practice Hooks ────────────────────────────────────────────────

/** Fetch practice sessions list */
export function usePracticeSessions() {
  return useQuery({
    queryKey: queryKeys.practice.sessions,
    queryFn: async () => {
      const raw = await practiceService.getSessions()
      return Array.isArray(raw) ? raw : raw.results ?? []
    },
  })
}

// ── Auth / Profile Mutation ───────────────────────────────────────

/** Mutation to update the current user's profile */
export function useUpdateProfile() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCurrentUserPayload) => authService.updateCurrentUser(data),
    onSuccess: () => {
      // Invalidate user-related caches so they re-fetch with fresh data
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser })
      qc.invalidateQueries({ queryKey: queryKeys.learner.profile })
    },
  })
}
