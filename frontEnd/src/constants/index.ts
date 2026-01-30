/**
 * Application Constants
 * 
 * Centralized configuration and constant values.
 * Avoid magic strings/numbers throughout the codebase.
 */

// ============================================
// Application Info
// ============================================

export const APP_NAME = 'Learn Lab'
export const APP_VERSION = '0.1.0'
export const APP_DESCRIPTION = 'Educational LMS Platform for Primary & Elementary School'

// ============================================
// API Configuration
// ============================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
export const API_TIMEOUT = 30000 // 30 seconds

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'learnlab_auth_token',
  REFRESH_TOKEN: 'learnlab_refresh_token',
  USER: 'learnlab_user',
  THEME: 'learnlab_theme',
  LOCALE: 'learnlab_locale',
} as const

// ============================================
// Route Paths
// ============================================

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Student
  STUDENT_DASHBOARD: '/student',
  STUDENT_PRACTICE: '/student/practice',
  STUDENT_PROGRESS: '/student/progress',
  STUDENT_SUBJECTS: '/student/subjects',
  
  // Teacher/Instructor
  TEACHER_DASHBOARD: '/teacher',
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_ANALYTICS: '/teacher/analytics',
  TEACHER_QUESTIONS: '/teacher/questions',
  
  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
} as const

// ============================================
// UI Constants
// ============================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const

// ============================================
// Validation
// ============================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const
