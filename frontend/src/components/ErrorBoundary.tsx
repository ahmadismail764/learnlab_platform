import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui'
import i18n from '@/i18n'
import { logger } from '@/utils'

/**
 * ErrorBoundary
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * With custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI to show on error */
  fallback?: ReactNode
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Whether to show the reset button */
  showReset?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error using centralized logger (handles dev/prod appropriately)
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              {i18n.t('common:errorBoundary.title')}
            </h2>
            
            <p className="text-neutral-600 mb-6">
              {i18n.t('common:errorBoundary.description')}
            </p>
            
            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left bg-neutral-100 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                  {i18n.t('common:errorBoundary.details')}
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.props.showReset !== false && (
                <Button
                  variant="primary"
                  onClick={this.handleReset}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {i18n.t('common:tryAgain')}
                </Button>
              )}
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 bg-transparent px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-150 ease-in-out hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
              >
                <Home className="w-4 h-4" />
                {i18n.t('common:goHome')}
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * withErrorBoundary HOC
 * 
 * Wraps a component with an ErrorBoundary.
 * 
 * Usage:
 * const SafeComponent = withErrorBoundary(MyComponent)
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`
  
  return ComponentWithErrorBoundary
}
