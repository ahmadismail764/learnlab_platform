/**
 * Auth Feature - Type Definitions
 * 
 * Authentication-related types.
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
  role?: 'student' | 'instructor' // Admin created differently
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
