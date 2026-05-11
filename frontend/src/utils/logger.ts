/**
 * Logger Utility
 * 
 * Centralized logging that respects environment.
 * - Development: Logs to console
 * - Production: Can be extended to send to monitoring service
 * 
 * Usage:
 * import { logger } from '@/utils/logger'
 * logger.error('Something went wrong', error)
 */

const isDev = import.meta.env.DEV

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
}

/**
 * Format log entry for consistency
 */
function formatLog(level: LogLevel, message: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  }
}

/**
 * Send log to external service (implement when needed)
 * This is a placeholder for production logging services like:
 * - Sentry
 * - LogRocket
 * - DataDog
 * - Azure Application Insights
 */
function sendToMonitoring(entry: LogEntry): void {
  void entry
  // TODO: Implement when monitoring service is set up
  // Example:
  // if (entry.level === 'error') {
  //   Sentry.captureException(entry.data)
  // }
}

export const logger = {
  /**
   * Debug level - only in development
   */
  debug: (message: string, ...data: unknown[]): void => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...data)
    }
  },

  /**
   * Info level - general information
   */
  info: (message: string, ...data: unknown[]): void => {
    if (isDev) {
      console.info(`[INFO] ${message}`, ...data)
    }
    // Could also send to analytics in production
  },

  /**
   * Warning level - potential issues
   */
  warn: (message: string, ...data: unknown[]): void => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...data)
    }
    const entry = formatLog('warn', message, data)
    sendToMonitoring(entry)
  },

  /**
   * Error level - actual errors
   */
  error: (message: string, error?: unknown, ...data: unknown[]): void => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, ...data)
    }
    const entry = formatLog('error', message, { error, data })
    sendToMonitoring(entry)
  },

  /**
   * Group related logs (dev only)
   */
  group: (label: string): void => {
    if (isDev) {
      console.group(label)
    }
  },

  /**
   * End log group (dev only)
   */
  groupEnd: (): void => {
    if (isDev) {
      console.groupEnd()
    }
  },

  /**
   * Time a operation (dev only)
   */
  time: (label: string): void => {
    if (isDev) {
      console.time(label)
    }
  },

  /**
   * End timing (dev only)
   */
  timeEnd: (label: string): void => {
    if (isDev) {
      console.timeEnd(label)
    }
  },
}
