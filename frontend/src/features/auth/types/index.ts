/**
 * Auth Feature - Type Definitions
 * 
 * Authentication-related types.
 * 
 * 2-Role Model:
 * - student: Self-registration allowed
 * - admin: Created by existing admin only
 */

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  // Only students can self-register; admin accounts created by existing admins
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: import('@/types').User | null
  tokens: AuthTokens | null
}
