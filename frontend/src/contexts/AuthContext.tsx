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
import { authService } from '@/services/auth'
import { isAdminOverrideEmail } from '@/utils/adminOverride'

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
  login: (credentials: { email: string; password: string }) => Promise<User>
  register: (userData: { email: string; username: string; password: string; first_name: string; last_name: string }) => Promise<User>
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
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(
    initialUser
      ? { user: initialUser, isAuthenticated: true, isLoading: false }
      : initialState
  )

  const resolveUserRole = useCallback((userData: any): User['role'] => {
    const email = String(userData.email ?? '')
    if (userData.is_staff || isAdminOverrideEmail(email)) {
      return 'admin'
    }
    return 'student'
  }, [])

  // Hydrate user on mount — check for existing JWT token
  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('learnlab_auth_token')
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      try {
        const userData = await authService.getCurrentUser()
        const user: User = {
          id: String(userData.id),
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: resolveUserRole(userData),
          createdAt: userData.date_joined,
          updatedAt: userData.date_joined,
        }
        setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        authService.logout()
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }

    hydrate()
  }, [initialUser, resolveUserRole])

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      await authService.login(credentials)
      const userData = await authService.getCurrentUser()

      const user: User = {
        id: String(userData.id),
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: resolveUserRole(userData),
        createdAt: userData.date_joined,
        updatedAt: userData.date_joined,
      }

      setState({ user, isAuthenticated: true, isLoading: false })
      return user
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [resolveUserRole])

  const register = useCallback(async (userData: { email: string; username: string; password: string; first_name: string; last_name: string }) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      await authService.register(userData)
      return await login({ email: userData.email, password: userData.password })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [login])

  const logout = useCallback(() => {
    authService.logout()
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
