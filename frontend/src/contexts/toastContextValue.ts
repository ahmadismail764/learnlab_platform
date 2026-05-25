import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

export interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

