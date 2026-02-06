import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@/constants'

/**
 * useLocalStorage Hook
 * 
 * Persist state to localStorage with type safety.
 * Automatically syncs across tabs.
 * 
 * Usage:
 * const [theme, setTheme] = useLocalStorage('theme', 'light')
 * 
 * @param key - Storage key (use STORAGE_KEYS constants)
 * @param initialValue - Default value if nothing in storage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get stored value or use initial
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Listen for changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T)
        } catch {
          // Ignore parse errors
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setStoredValue]
}

/**
 * Type-safe storage keys
 * Ensures you use defined keys from constants
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
