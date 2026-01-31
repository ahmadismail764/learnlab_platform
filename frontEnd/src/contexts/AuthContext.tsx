import { 
  createContext, 
  useContext, 
  useState, 
  useCallback,
  useMemo,
  type ReactNode 
} from 'react'
import type { User } from '@/types'

/**
 * AuthContext
 * 
 * Manages authentication state across the application.
 * Single Responsibility: Only handles auth state, not API calls.
 */

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Initial state - could be hydrated from localStorage in real app
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

interface AuthProviderProps {
  children: ReactNode
  /** Optional initial user for development/testing */
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => ({
    ...initialState,
    user: initialUser,
    isAuthenticated: Boolean(initialUser),
  }))

  const login = useCallback((user: User) => {
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const logout = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }))
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    logout,
    updateUser,
  }), [state, login, logout, updateUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 * Throws if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook to get current user (throws if not authenticated)
 * Use this when you're sure the user is logged in
 */
export function useCurrentUser(): User {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated || !user) {
    throw new Error('useCurrentUser must be used in an authenticated context')
  }
  
  return user
}
