/**
 * Custom Render with Providers
 * 
 * Wraps components with all necessary providers for testing.
 * Use this instead of @testing-library/react's render.
 * 
 * Usage:
 * import { renderWithProviders } from '@/test-utils'
 * 
 * test('my component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />)
 *   expect(getByText('Hello')).toBeInTheDocument()
 * })
 */

import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import type { User } from '@/types'

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock student user
 */
export function createMockStudent(overrides: Partial<User> = {}): User {
  return createMockUser({
    role: 'student',
    email: 'student@example.com',
    firstName: 'Student',
    ...overrides,
  })
}

/**
 * Create a mock admin user
 */
export function createMockAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    role: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    ...overrides,
  })
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial user for AuthProvider */
  user?: User | null
  /** Initial route for Router */
  route?: string
  /** Whether to include Router (set false for unit tests) */
  withRouter?: boolean
}

/**
 * All providers wrapper for testing
 */
function AllProviders({ 
  children, 
  user = null,
  withRouter = true,
}: { 
  children: ReactNode
  user?: User | null
  withRouter?: boolean
}) {
  const content = (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider initialUser={user}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  )

  if (withRouter) {
    return <BrowserRouter>{content}</BrowserRouter>
  }

  return content
}

/**
 * Custom render function that wraps component with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { user = null, route = '/', withRouter = true, ...renderOptions } = options

  // Set initial route if using router
  if (withRouter && route !== '/') {
    window.history.pushState({}, 'Test page', route)
  }

  return {
    user,
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllProviders user={user} withRouter={withRouter}>
          {children}
        </AllProviders>
      ),
      ...renderOptions,
    }),
  }
}
