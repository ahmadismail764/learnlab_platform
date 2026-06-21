import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/contexts'
import { useQueryClient, type Query } from '@tanstack/react-query'

/**
 * useApiErrorInterceptor
 *
 * Global interceptor that catches failed React Query requests
 * and surfaces them as toast notifications.
 *
 * Handles:
 * - Network errors ("Failed to fetch") → connection warning
 * - 5xx server errors → "Server error" toast
 * - 403 forbidden → "Access denied" toast
 * - Silently ignores 401 (handled by api.ts token refresh logic)
 *
 * Mount once near the app root (inside both QueryProvider and ToastProvider).
 */
export function useApiErrorInterceptor() {
  const { t } = useTranslation('common')
  const { showError, showWarning } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const cache = queryClient.getQueryCache()

    const unsubscribe = cache.subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'error') return

      const query: Query = event.query
      const error = query.state.error

      if (!error) return

      const message = error instanceof Error ? error.message : String(error)
      const lowerMsg = message.toLowerCase()

      // Network failure
      if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('networkerror') || lowerMsg.includes('network request failed')) {
        showWarning(t('errors.network'))
        return
      }

      // Server errors
      if (lowerMsg.includes('500') || lowerMsg.includes('server error')) {
        showError(t('errors.server'))
        return
      }

      // Forbidden
      if (lowerMsg.includes('403') || lowerMsg.includes('forbidden') || lowerMsg.includes('access denied')) {
        showWarning(t('errors.forbidden'))
        return
      }

      // Ignore 401 (handled by token refresh in api.ts)
      if (lowerMsg.includes('401') || lowerMsg.includes('unauthorized')) {
        return
      }

      // Generic fallback for anything else that failed
      // Only show if the error message is meaningful (not a raw fetch error)
      if (message.length > 0 && message.length < 200) {
        showError(message)
      }
    })

    return unsubscribe
  }, [queryClient, showError, showWarning, t])
}
