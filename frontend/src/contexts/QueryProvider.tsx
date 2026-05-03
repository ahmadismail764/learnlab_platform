import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * QueryProvider
 *
 * App-wide React Query configuration.
 * Wraps the application with a shared QueryClient whose defaults
 * are tuned for a learning platform:
 * - Stale time: 2 min — mastery data doesn't change every second
 * - Retry: 1 — fail fast, the error interceptor handles the UX
 * - Refetch on window focus: true — picks up changes when the user comes back
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,          // 2 minutes
      gcTime: 10 * 60 * 1000,             // 10 minutes garbage collection
      retry: 0,                           // Fail fast to prevent long loading states on network errors
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
