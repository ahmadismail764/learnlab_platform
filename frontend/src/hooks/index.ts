/**
 * Custom Hooks Index
 * 
 * Shared hooks used across the application.
 * Each hook should follow Single Responsibility Principle.
 * 
 * Naming convention: use[Feature]
 */

// Storage
export { useLocalStorage, type StorageKey } from './useLocalStorage'

// Timing
export { useDebounce, useDebouncedCallback } from './useDebounce'

// Viewport
export { 
  useMediaQuery, 
  useBreakpoint, 
  useIsMobile, 
  usePrefersDarkMode,
  usePrefersReducedMotion 
} from './useMediaQuery'

