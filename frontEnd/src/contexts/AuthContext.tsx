import { 
  createContext, 
  useContext, 
  useState, 
  useEffect,
  useCallback,
  useMemo,
  type ReactNode 
} from 'react'
import type { User } from '@/types'

/**
 * AuthContext
 * 
 * Manages authentication state across the application.
 * Single Responsibility: Only handles auth state, not API calls directly (delegates to service).
 */

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void
  register: (userData: any) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check auth
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState)

  // Hydrate user on mount (check localStorage for persisted session)
  useEffect(() => {
    const stored = localStorage.getItem('learnlab_user')
    if (stored) {
      try {
        const user = JSON.parse(stored) as User
        setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        localStorage.removeItem('learnlab_user')
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = useCallback((user: User) => {
    localStorage.setItem('learnlab_user', JSON.stringify(user))
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const register = useCallback(async (_userData: any) => {
    // In production, this will call the backend API
    // For now, no-op — registration is not wired yet
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('learnlab_user')
    localStorage.removeItem('learnlab_auth_token')
    localStorage.removeItem('learnlab_refresh_token')
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
    register,
    logout,
    updateUser,
  }), [state, login, register, logout, updateUser])

  if (state.isLoading) {
    // Show a minimal loading state while hydrating
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useCurrentUser(): User {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) {
    throw new Error('useCurrentUser must be used in an authenticated context')
  }
  return user
}
