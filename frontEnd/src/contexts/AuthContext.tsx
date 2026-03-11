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
 * Currently uses mock/local data — no backend integration yet.
 */

const STORAGE_KEY = 'learnlab_user'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void
  register: (userData: any) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check stored user
}

interface AuthProviderProps {
  children: ReactNode
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(
    initialUser
      ? { user: initialUser, isAuthenticated: true, isLoading: false }
      : initialState
  )

  // Hydrate user from localStorage on mount (no backend call)
  useEffect(() => {
    if (initialUser !== undefined) return // skip hydration when pre-seeded (tests)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const user: User = JSON.parse(stored)
        setState({ user, isAuthenticated: true, isLoading: false })
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }, [initialUser])

  const login = useCallback((user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  const register = useCallback((userData: any) => {
    const user: User = {
      id: userData.id ?? crypto.randomUUID(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role ?? 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    login(user)
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    // Navigation is handled by AppRouter observing user state change
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
