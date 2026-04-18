/**
 * Mock Contexts for Testing
 * 
 * Pre-configured mock values for context providers.
 * Use these when you need to mock specific context states.
 * 
 * Usage:
 * jest.mock('@/contexts/AuthContext', () => ({
 *   useAuth: () => mockAuthContext.authenticated,
 * }))
 */

import { vi } from 'vitest'
import type { User } from '@/types'

// ============================================
// Auth Context Mocks
// ============================================

const mockUser: User = {
  id: 'mock-user-1',
  email: 'mock@example.com',
  firstName: 'Mock',
  lastName: 'User',
  role: 'learner',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockAuthContext = {
  /** Unauthenticated state */
  unauthenticated: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  },
  
  /** Authenticated learner state */
  authenticated: {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  },
  
  /** Loading state */
  loading: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  },
  
  /** Admin user state */
  admin: {
    user: { ...mockUser, role: 'admin' as const },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  },
}

// ============================================
// Toast Context Mocks
// ============================================

export const mockToastContext = {
  default: {
    toasts: [],
    showToast: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    removeToast: vi.fn(),
    clearAll: vi.fn(),
  },
}

// ============================================
// Theme Context Mocks
// ============================================

export const mockThemeContext = {
  light: {
    theme: 'light' as const,
    resolvedTheme: 'light' as const,
    isDark: false,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  },
  
  dark: {
    theme: 'dark' as const,
    resolvedTheme: 'dark' as const,
    isDark: true,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  },
  
  system: {
    theme: 'system' as const,
    resolvedTheme: 'light' as const,
    isDark: false,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  },
}

// ============================================
// Helper to reset all mocks
// ============================================

export function resetAllMocks() {
  Object.values(mockAuthContext).forEach(mock => {
    mock.login.mockReset()
    mock.logout.mockReset()
    mock.updateUser.mockReset()
  })
  
  Object.values(mockToastContext).forEach(mock => {
    mock.showToast.mockReset()
    mock.showSuccess.mockReset()
    mock.showError.mockReset()
    mock.showWarning.mockReset()
    mock.showInfo.mockReset()
    mock.removeToast.mockReset()
    mock.clearAll.mockReset()
  })
  
  Object.values(mockThemeContext).forEach(mock => {
    mock.setTheme.mockReset()
    mock.toggleTheme.mockReset()
  })
}
