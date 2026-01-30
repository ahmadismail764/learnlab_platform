/**
 * Shared TypeScript Types Index
 * 
 * Global type definitions used across the application.
 * Feature-specific types live in their feature folders.
 * 
 * Examples:
 * - User types
 * - API response types
 * - Common utility types
 */

// ============================================
// User & Role Types
// ============================================

export type UserRole = 'student' | 'instructor' | 'administrator'

// Future roles (commented for planning)
// | 'parent'
// | 'moderator'
// | 'content_creator'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Common Utility Types
// ============================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined

/** Make specific keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Make specific keys required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
