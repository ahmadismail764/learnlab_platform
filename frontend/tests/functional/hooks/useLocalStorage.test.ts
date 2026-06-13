import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

describe('useLocalStorage Hook', () => {
  const TEST_KEY = 'test_key'

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('initializes with the default value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default_value'))
    
    expect(result.current[0]).toBe('default_value')
    expect(JSON.parse(localStorage.getItem(TEST_KEY) || '')).toBe('default_value')
  })

  it('initializes with the value already stored in localStorage', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify('stored_value'))
    
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default_value'))
    
    expect(result.current[0]).toBe('stored_value')
  })

  it('updates the stored value in localStorage when state changes', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
    
    act(() => {
      result.current[1]('new_value')
    })

    expect(result.current[0]).toBe('new_value')
    expect(JSON.parse(localStorage.getItem(TEST_KEY) || '')).toBe('new_value')
  })

  it('supports updater callback function', () => {
    const { result } = renderHook(() => useLocalStorage<number>(TEST_KEY, 10))

    act(() => {
      const updater = result.current[1]
      updater((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(15)
    expect(JSON.parse(localStorage.getItem(TEST_KEY) || '')).toBe(15)
  })

  it('synchronizes state when a storage event is fired from another tab/window', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'tab1'))

    expect(result.current[0]).toBe('tab1')

    // Simulate cross-tab storage change event
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: TEST_KEY,
        newValue: JSON.stringify('tab2_updated'),
      })
      window.dispatchEvent(storageEvent)
    })

    expect(result.current[0]).toBe('tab2_updated')
  })

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'tab1'))

    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'different_key',
        newValue: JSON.stringify('should_ignore'),
      })
      window.dispatchEvent(storageEvent)
    })

    expect(result.current[0]).toBe('tab1') // Unchanged!
  })

  it('handles corrupted JSON in localStorage gracefully during initialization', () => {
    localStorage.setItem(TEST_KEY, '{corrupted-json')
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'safe_fallback'))

    expect(result.current[0]).toBe('safe_fallback')
    expect(consoleWarnSpy).toHaveBeenCalled()
  })

  it('handles write failures in localStorage without crashing', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))

    act(() => {
      result.current[1]('updated_value')
    })

    expect(result.current[0]).toBe('updated_value') // State still updates in-memory
    expect(setItemSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalled() // Logs the write failure warning
  })
})
