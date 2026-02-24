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
  login: (credentials: any) => Promise<void>
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

  // Hydrate user on mount
  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('learnlab_auth_token');
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const userDate = await authService.getCurrentUser();
        // Map backend user to frontend user
        const user: User = {
          id: userDate.id,
          email: userDate.email,
          firstName: userDate.first_name,
          lastName: userDate.last_name,
          role: userDate.is_staff ? 'admin' : 'student',
          createdAt: userDate.date_joined,
          updatedAt: userDate.date_joined, // backend doesn't send updated_at yet
        };

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to hydrate user", error);
        // Clear tokens if invalid
        authService.logout();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    hydrate();
  }, []);

  const login = useCallback(async (credentials: any) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.login(credentials);
      const userDate = await authService.getCurrentUser();

      const user: User = {
        id: userDate.id,
        email: userDate.email,
        firstName: userDate.first_name,
        lastName: userDate.last_name,
        role: userDate.is_staff ? 'admin' : 'student',
        createdAt: userDate.date_joined,
        updatedAt: userDate.date_joined,
      };

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [])

  const register = useCallback(async (userData: any) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.register(userData);
      // Auto login
      await login({ email: userData.email, password: userData.password });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [login])

  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
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
