import {
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastVariant,
} from './toastContextValue'

/**
 * Toast/Notification Context
 * 
 * Provides app-wide toast notifications for success, error, warning, and info messages.
 */

// Generate unique IDs
let toastId = 0
const generateId = () => `toast-${++toastId}`

// Default durations by variant
const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
}

interface ToastProviderProps {
  children: ReactNode
  /** Maximum number of toasts to show at once */
  maxToasts?: number
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration?: number) => {
      const id = generateId()
      const toast: Toast = {
        id,
        message,
        variant,
        duration: duration ?? DEFAULT_DURATIONS[variant],
      }

      setToasts((prev) => {
        // Remove oldest if at max
        const newToasts = prev.length >= maxToasts ? prev.slice(1) : prev
        return [...newToasts, toast]
      })

      // Auto-remove after duration
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, toast.duration)
      }
    },
    [maxToasts, removeToast]
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  )

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeToast,
      clearAll,
    }),
    [toasts, showToast, showSuccess, showError, showWarning, showInfo, removeToast, clearAll]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Toast Container - renders toast notifications
 */
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  const { t } = useTranslation('common')

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      role="region"
      aria-label={t('notifications')}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

/**
 * Individual Toast Item
 */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { t } = useTranslation('common')
  const variantConfig: Record<
    ToastVariant,
    { icon: typeof CheckCircle; bg: string; border: string; iconColor: string }
  > = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900/40',
      border: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/40',
      border: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 dark:bg-amber-900/40',
      border: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/40',
      border: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  }

  const config = variantConfig[toast.variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'animate-in slide-in-from-right-full rtl:slide-in-from-left-full fade-in duration-300',
        config.bg,
        config.border
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <p className="flex-1 text-sm text-neutral-800 dark:text-neutral-100">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label={t('dismissNotification')}
        title={t('dismissNotification')}
      >
        <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  )
}
