import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('updates the debounced value only after the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    )

    expect(result.current).toBe('hello')

    // Rerender with a new value
    rerender({ value: 'world', delay: 300 })
    expect(result.current).toBe('hello') // still old value

    // Fast-forward by 150ms
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('hello') // still old value

    // Fast-forward another 150ms (total 300ms)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('world') // updated!
  })

  it('cancels the previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )

    // Trigger update 1
    rerender({ value: 'second', delay: 300 })
    
    // Wait 200ms (not enough to trigger)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('first')

    // Trigger update 2 (should cancel the timer for 'second' and schedule a new 300ms delay)
    rerender({ value: 'third', delay: 300 })

    // Wait another 150ms (total 350ms from start, but only 150ms from update 2)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('first') // Still 'first' because 'third' timer is still active

    // Wait another 150ms (reaches 300ms since 'third' was set)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('third') // Updated to the latest!
  })
})

describe('useDebouncedCallback Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes the callback after the specified delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1', 'arg2')
    })
    expect(callback).not.toHaveBeenCalled()

    // Advance 499ms
    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(callback).not.toHaveBeenCalled()

    // Advance to 500ms
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancels previous pending callback invocations when called again quickly', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 200))

    act(() => {
      result.current('call1')
    })
    
    // Advance 100ms
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    // Trigger second call
    act(() => {
      result.current('call2')
    })

    // Advance another 150ms (reaches 250ms from start, but only 150ms from call2)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(callback).not.toHaveBeenCalled() // still hasn't fired

    // Advance 50ms more (200ms from call2)
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('call2') // only gets called with the latest argument
  })
})
