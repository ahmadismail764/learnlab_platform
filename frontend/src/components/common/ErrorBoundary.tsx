import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * ErrorBoundary
 *
 * Catches unhandled React render errors and displays a branded
 * fallback instead of a white screen. Wraps route outlets so a
 * single page crash doesn't take down the whole app.
 */

interface Props {
  children: ReactNode
  /** Optional custom fallback UI */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              Something went wrong
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              An unexpected error occurred while rendering this page.
              Try refreshing, or go back to the dashboard.
            </p>
            {this.state.error && (
              <details className="text-start bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 text-xs text-neutral-500 dark:text-neutral-400">
                <summary className="cursor-pointer font-medium mb-1">Error details</summary>
                <code className="block whitespace-pre-wrap break-all">
                  {this.state.error.message}
                </code>
              </details>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
