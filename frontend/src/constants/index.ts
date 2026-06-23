/**
 * Application Constants
 * 
 * Centralized configuration and constant values.
 * Avoid magic strings/numbers throughout the codebase.
 */

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
// UI Constants
// ============================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// ============================================
// Mastery / Topic Status
// ============================================

export { MASTERY_STATUS_BADGE_VARIANT, MASTERY_STATUS_ICONS } from './mastery'
export type { TopicMastery } from './mastery'

// ============================================
// Demo / Local QA Accounts
// ============================================

export {
  DEMO_SEED_TOPIC,
  LEADERBOARD_DEMO_ACCOUNTS,
  LOGIN_DEMO_ACCOUNTS,
} from './demoAccounts'

