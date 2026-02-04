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
export const APP_DESCRIPTION = 'Discrete Mathematics Learning Platform for College Students'

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
  STUDENT_TOPICS: '/student/topics',
  STUDENT_ACHIEVEMENTS: '/student/achievements',
  
  // Admin (Content Manager)
  ADMIN_DASHBOARD: '/admin',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  

} as const

// ============================================
// Course Configuration (OCP: Extensible)
// ============================================

/**
 * Current active course - Discrete Mathematics
 * Architecture supports adding more courses later
 * by extending this configuration
 */
export const CURRENT_COURSE = {
  id: 'discrete-math',
  nameKey: 'topics:discreteMath',
  icon: '🔢',
} as const

/**
 * All available courses (extensible)
 * To add a new course:
 * 1. Add course config here
 * 2. Add translations in topics namespace
 * 3. Create topic hierarchy in database
 */
export const COURSES = [CURRENT_COURSE] as const

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
