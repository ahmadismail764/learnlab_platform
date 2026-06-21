import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AUTH_CLEARED_EVENT } from '@/services/api'
import { useAuth } from '@/contexts'
import { createMockLearner, renderWithProviders } from '@/test-utils'

function AuthStateProbe() {
  const { isAuthenticated, user } = useAuth()

  return (
    <output aria-label="auth-state">
      {isAuthenticated && user ? user.email : 'signed-out'}
    </output>
  )
}

describe('AuthProvider', () => {
  it('clears live auth state when the API layer clears stored auth', () => {
    renderWithProviders(<AuthStateProbe />, {
      user: createMockLearner({ email: 'learner@example.com' }),
      withRouter: false,
    })

    expect(screen.getByLabelText('auth-state')).toHaveTextContent('learner@example.com')

    act(() => {
      window.dispatchEvent(new Event(AUTH_CLEARED_EVENT))
    })

    expect(screen.getByLabelText('auth-state')).toHaveTextContent('signed-out')
  })
})

