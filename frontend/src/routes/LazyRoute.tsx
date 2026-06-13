import { Suspense, type ReactNode } from 'react'
import { Spinner } from '@/components/ui/Loading'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}


