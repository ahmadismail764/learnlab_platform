import { useState, useEffect } from 'react'
import { BREAKPOINTS } from '@/constants'

/**
 * useMediaQuery Hook
 * 
 * Respond to CSS media query changes.
 * 
 * Usage:
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
 * 
 * @param query - CSS media query string
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener('change', handler)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

/**
 * useBreakpoint Hook
 * 
 * Check if viewport is at or above a breakpoint.
 * Uses Tailwind breakpoints from constants.
 * 
 * Usage:
 * const isDesktop = useBreakpoint('lg')  // true if >= 1024px
 * const isTablet = useBreakpoint('md')   // true if >= 768px
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const width = BREAKPOINTS[breakpoint]
  return useMediaQuery(`(min-width: ${width}px)`)
}

/**
 * useIsMobile Hook
 * 
 * Convenience hook for mobile detection.
 * Returns true if viewport is below 'md' breakpoint (768px).
 */
export function useIsMobile(): boolean {
  return !useBreakpoint('md')
}

/**
 * usePrefersDarkMode Hook
 * 
 * Check if user prefers dark mode at OS level.
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * usePrefersReducedMotion Hook
 * 
 * Check if user prefers reduced motion.
 * Use this to disable animations for accessibility.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
