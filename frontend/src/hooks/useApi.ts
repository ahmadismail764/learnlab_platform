import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { learnersService, type LearnerProfile, type LeaderboardLearner } from '@/services/learners'
import { topicsService } from '@/services/topics'
import { analyticsService, type AggregatedMetricsResponse } from '@/services/analytics'
import { practiceService } from '@/services/practice'
import { authService, type UpdateCurrentUserPayload } from '@/services/auth'

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
  analytics: {
    aggregated: ['analytics', 'aggregated'] as const,
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

/** Fetch topic mastery data (FIRe memory/speed/status per topic) */
export function useTopicMastery() {
  return useQuery({
    queryKey: queryKeys.learner.mastery,
    queryFn: async () => {
      try {
        const raw = await topicsService.getTopicMastery()
        return Array.isArray(raw) ? raw : raw.results ?? []
      } catch (e) {
        console.warn('Backend TopicMastery API is currently returning 500. Falling back to empty array.', e)
        return []
      }
    },
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
    queryFn: async () => {
      const raw = await topicsService.getTopics()
      return Array.isArray(raw) ? raw : raw.results ?? []
    },
  })
}

/** Fetch all questions */
export function useQuestions() {
  return useQuery({
    queryKey: ['questions', 'list'],
    queryFn: async () => {
      const { questionsService } = await import('@/services/questions')
      const raw: any = await questionsService.getQuestions()
      return Array.isArray(raw) ? raw : raw.results ?? []
    },
  })
}

// ── Analytics Hooks ───────────────────────────────────────────────

/** Fetch aggregated analytics metrics (admin) */
export function useAggregatedMetrics() {
  return useQuery<AggregatedMetricsResponse>({
    queryKey: queryKeys.analytics.aggregated,
    queryFn: () => analyticsService.getAggregatedMetrics(),
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
