import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { queryClient } from './queryClient'

/**
 * QueryProvider
 *
 * App-wide React Query configuration.
 * Wraps the application with a shared QueryClient whose defaults
 * are tuned for a learning platform:
 * - Stale time: 2 min — mastery data doesn't change every second
 * - Retry: 0 — fail fast, the error interceptor handles the UX
 * - Refetch on window focus: true — picks up changes when the user comes back
 */

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
