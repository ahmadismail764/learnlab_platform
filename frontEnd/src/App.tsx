import { useMemo, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider, ToastProvider, useAuth } from '@/contexts'
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
  
  const router = useMemo(() => createAppRouter(user), [user])
  
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Suspense>
  )
}
