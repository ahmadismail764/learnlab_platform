/**
 * API Error Handling Utilities
 * 
 * Provides consistent error handling for API calls.
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly details?: Record<string, string[]>

  constructor(
    message: string,
    status: number = 500,
    code: string = 'UNKNOWN_ERROR',
    details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    
    // Maintains proper stack trace for where error was thrown (V8 engines)
    const ErrorWithCapture = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: Function) => void
    }
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, ApiError)
    }
  }

  /**
   * Create ApiError from fetch Response
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let message = 'An unexpected error occurred'
    let code = 'UNKNOWN_ERROR'
    let details: Record<string, string[]> | undefined

    try {
      const data = await response.json()
      message = data.message || data.error || message
      code = data.code || code
      details = data.errors || data.details
    } catch {
      // Response wasn't JSON, use status text
      message = response.statusText || message
    }

    return new ApiError(message, response.status, code, details)
  }

  /**
   * Check if error is a specific type
   */
  isNotFound(): boolean {
    return this.status === 404
  }

  isUnauthorized(): boolean {
    return this.status === 401
  }

  isForbidden(): boolean {
    return this.status === 403
  }

  isValidationError(): boolean {
    return this.status === 422 || this.status === 400
  }

  isServerError(): boolean {
    return this.status >= 500
  }

  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR'
  }
}

/**
 * Network Error - when fetch fails entirely
 */
export class NetworkError extends ApiError {
  constructor(originalError?: Error) {
    super(
      'Unable to connect. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    )
    this.name = 'NetworkError'
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends ApiError {
  constructor(timeout: number) {
    super(
      `Request timed out after ${timeout}ms. Please try again.`,
      0,
      'TIMEOUT_ERROR'
    )
    this.name = 'TimeoutError'
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Safe async wrapper - catches errors and returns tuple
 * 
 * Usage:
 * const [data, error] = await safeAsync(fetchData())
 * if (error) { handle error }
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

/**
 * Retry wrapper for failed requests
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    shouldRetry?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    shouldRetry = (error) => {
      // Only retry on network errors or 5xx server errors
      if (isApiError(error)) {
        return error.isNetworkError() || error.isServerError()
      }
      return false
    },
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }

      // Exponential backoff
      await new Promise((resolve) => 
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      )
    }
  }

  throw lastError
}
