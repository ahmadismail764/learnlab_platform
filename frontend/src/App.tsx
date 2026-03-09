import { useMemo, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider, ToastProvider, ThemeProvider, useAuth } from '@/contexts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLoader } from '@/components/ui'
import { createAppRouter } from '@/routes'

/**
 * App Root Component
 * 
 * Sets up providers, error boundary, i18n Suspense, and routing.
 */

function AppRouter() {
  const { user } = useAuth()
  const routerInstance = useMemo(() => createAppRouter(user), [user])
  return <RouterProvider router={routerInstance} />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>
  )
}
