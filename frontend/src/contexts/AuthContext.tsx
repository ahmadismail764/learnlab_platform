import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@/types";
import {
  authService,
  type BackendAuthUser,
  type LoginCredentials,
} from "@/services/auth";
import { getToken } from "@/services/api";
import { AuthContext, type AuthContextValue } from "./authContextValue";

/**
 * AuthContext
 *
 * Manages authentication state across the application.
 * Single Responsibility: Only handles auth state, not API calls directly (delegates to service).
 *
 * Key decisions:
 * - isLoading is ONLY true during initial hydration (checking if a stored token is still valid)
 * - Login/register do NOT set isLoading on context — the calling component handles its own loading state
 *   to avoid the auth provider rendering a blocking "Loading..." overlay during auth requests
 */

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check auth
};

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

function resolveRole(userData: BackendAuthUser): UserRole {
  if (userData.role === "admin" || userData.role === "learner") {
    return userData.role;
  }
  return userData.is_staff ? "admin" : "learner";
}

function mapBackendUser(userData: BackendAuthUser): User {
  return {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    role: resolveRole(userData),
    createdAt: userData.date_joined,
    updatedAt: userData.date_joined,
  };
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => {
    if (!initialUser) {
      return initialState;
    }

    return {
      user: initialUser,
      isAuthenticated: true,
      isLoading: false,
    };
  });

  // Hydrate user on mount
  useEffect(() => {
    const hydrate = async () => {
      if (initialUser) {
        return;
      }

      const token = getToken("learnlab_auth_token");
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const backendUser = await authService.getCurrentUser();
        const user = mapBackendUser(backendUser);

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
  }, [initialUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // NOTE: We do NOT set isLoading here.
    // The calling page (LoginPage) manages its own button/loading state.
    // Setting isLoading on the context would render the global "Loading..." screen
    // which blocks the login form and hides any error messages.
    await authService.login(credentials);
    const backendUser = await authService.getCurrentUser();
    const user = mapBackendUser(backendUser);

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    return user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      updateUser,
    }),
    [state, login, logout, updateUser],
  );

  if (state.isLoading) {
    // Show a minimal loading state while hydrating
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
