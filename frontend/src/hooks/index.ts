/**
 * Custom Hooks Index
 * 
 * Shared hooks used across the application.
 * Each hook should follow Single Responsibility Principle.
 * 
 * Naming convention: use[Feature]
 */

// Storage
export { useLocalStorage, type StorageKey } from './useLocalStorage'

// Timing
export { useDebounce, useDebouncedCallback } from './useDebounce'

// Viewport
export { 
  useMediaQuery, 
  useBreakpoint, 
  useIsMobile, 
  usePrefersDarkMode,
  usePrefersReducedMotion 
} from './useMediaQuery'

// Data fetching (React Query)
export {
  useLearnerProfile,
  useTopicMastery,
  useGlobalLeaderboard,
  useTopicLeaderboard,
  useTopics,
  useQuestions,
  useAggregatedMetrics,
  useBulkTopicAnalytics,
  useActivityTimeSeries,
  useDifficultyBreakdown,
  useAuditLogs,
  useSystemHealth,
  usePracticeSessions,
  useReviewForecast,
  useUpdateProfile,
  useSuspenseGlobalLeaderboard,
  useSuspenseTopicLeaderboard,
  useSuspenseTopics,
  useSuspenseQuestions,
  queryKeys,
} from './useApi'

// API error interceptor (global)
export { useApiErrorInterceptor } from './useApiErrorInterceptor'
export { useLanguage } from './useLanguage'
