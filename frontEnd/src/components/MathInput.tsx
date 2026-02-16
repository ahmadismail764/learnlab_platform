import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { MathfieldElement } from 'mathlive'
import 'mathlive'

/**
 * MathInput Component
 * 
 * A mathematical input field using MathLive with virtual keyboard support.
 * Features:
 * - LaTeX input/output
 * - Virtual keyboard for touch devices
 * - RTL support
 * - Theming to match app design
 * - Auto-close keyboard on unmount (page navigation)
 * - Clear close button for keyboard dismissal
 */

export interface MathInputProps {
  /** Initial LaTeX value */
  value?: string
  /** Callback when value changes */
  onChange?: (latex: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is read-only */
  readOnly?: boolean
  /** Whether to show the virtual keyboard toggle */
  showKeyboard?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether the field is disabled */
  disabled?: boolean
}

export function MathInput({
  value = '',
  onChange,
  placeholder,
  readOnly = false,
  showKeyboard = true,
  className = '',
  disabled = false,
}: MathInputProps) {
  const { i18n, t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mathFieldRef = useRef<MathfieldElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Hide virtual keyboard on unmount (e.g. navigating away from the page)
  useEffect(() => {
    return () => {
      if (window.mathVirtualKeyboard?.visible) {
        window.mathVirtualKeyboard.hide()
      }
    }
  }, [])

  // Track keyboard visibility changes
  useEffect(() => {
    const vk = window.mathVirtualKeyboard
    if (!vk) return

    const handleVisibilityChange = () => {
      setKeyboardVisible(vk.visible)
    }

    vk.addEventListener('geometrychange', handleVisibilityChange)
    return () => {
      vk.removeEventListener('geometrychange', handleVisibilityChange)
    }
  }, [])

  // Create and mount the math field
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create the math-field element
    const mf = document.createElement('math-field') as MathfieldElement
    mathFieldRef.current = mf

    // Set attributes
    mf.className = 'w-full min-h-[3rem] p-3 text-lg focus:outline-none'
    mf.style.fontSize = '1.25rem'
    mf.style.setProperty('--caret-color', 'var(--color-primary-500, #3b82f6)')
    mf.style.setProperty('--selection-background-color', 'var(--color-primary-100, #dbeafe)')
    // Note: Dark mode colors are handled by a separate useEffect that listens for theme changes

    // Configure virtual keyboard
    if (showKeyboard) {
      mf.mathVirtualKeyboardPolicy = 'manual'
    }

    // Configure keyboard layouts for discrete math
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.layouts = ['numeric', 'symbols', 'greek']
    }

    // Set read-only state
    if (readOnly || disabled) {
      mf.readOnly = true
    }

    // Set initial value
    if (value) {
      mf.setValue(value)
    }

    // Add event listeners
    mf.addEventListener('input', handleInput as EventListener)
    mf.addEventListener('focus', handleFocus)
    mf.addEventListener('blur', handleBlur)

    // Mount to container
    container.appendChild(mf)
    setIsReady(true)

    // Cleanup
    return () => {
      mf.removeEventListener('input', handleInput as EventListener)
      mf.removeEventListener('focus', handleFocus)
      mf.removeEventListener('blur', handleBlur)
      if (container.contains(mf)) {
        container.removeChild(mf)
      }
      mathFieldRef.current = null
    }
  }, [])

  // Update value when prop changes
  useEffect(() => {
    const mf = mathFieldRef.current
    if (mf && isReady && mf.getValue() !== value) {
      mf.setValue(value)
    }
  }, [value, isReady])

  // Update read-only state
  useEffect(() => {
    const mf = mathFieldRef.current
    if (mf && isReady) {
      mf.readOnly = readOnly || disabled
    }
  }, [readOnly, disabled, isReady])

  // Handle RTL direction
  useEffect(() => {
    const mf = mathFieldRef.current
    if (!mf || !isReady) return
    
    // Math content is always LTR
    mf.style.direction = 'ltr'
    
    // Add RTL class for container styling
    const isRTL = i18n.dir() === 'rtl'
    if (isRTL) {
      mf.classList.add('rtl-container')
    } else {
      mf.classList.remove('rtl-container')
    }
  }, [i18n.language, isReady])

  // Handle dark mode changes
  useEffect(() => {
    const mf = mathFieldRef.current
    if (!mf || !isReady) return

    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      mf.style.color = isDark ? '#f4f4f5' : '#18181b'
      mf.style.setProperty('--selection-background-color', isDark ? 'rgba(34, 197, 94, 0.3)' : 'var(--color-primary-100, #dbeafe)')
    }

    // Initial update
    updateTheme()

    // Listen for class changes on documentElement (theme toggle)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateTheme()
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [isReady])

  // Handle input changes
  const handleInput = (evt: Event) => {
    const target = evt.target as MathfieldElement
    const latex = target.getValue()
    onChange?.(latex)
  }

  // Handle focus events for virtual keyboard
  const handleFocus = () => {
    setIsFocused(true)
    if (showKeyboard && !readOnly && !disabled && window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.show()
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Don't hide keyboard immediately - user might tap on it
  }

  // Hide the virtual keyboard explicitly
  const hideKeyboard = useCallback(() => {
    if (window.mathVirtualKeyboard?.visible) {
      window.mathVirtualKeyboard.hide()
    }
  }, [])

  // Toggle virtual keyboard manually
  const toggleKeyboard = () => {
    const vk = window.mathVirtualKeyboard
    if (vk) {
      if (vk.visible) {
        vk.hide()
      } else {
        vk.show()
        mathFieldRef.current?.focus()
      }
    }
  }

  return (
    <div className={`math-input-container ${className}`}>
      <div
        className={`
          relative rounded-lg border-2 transition-colors
          ${isFocused ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/50' : 'border-neutral-300 dark:border-neutral-600'}
          ${disabled ? 'bg-neutral-100 dark:bg-neutral-800 opacity-60' : 'bg-white dark:bg-neutral-900'}
          ${readOnly ? 'bg-neutral-50 dark:bg-neutral-800' : ''}
        `}
      >
        {/* Math field will be mounted here */}
        <div ref={containerRef} />
        
        {placeholder && !value && !isFocused && (
          <div
            className="absolute inset-0 flex items-center px-3 pointer-events-none text-neutral-400 dark:text-neutral-500"
            dir={i18n.dir()}
            style={{ textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Virtual Keyboard Toggle & Close Buttons */}
      {showKeyboard && !readOnly && !disabled && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleKeyboard}
            className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700/70 rounded-lg transition-colors flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="2"/>
              <line x1="6" y1="10" x2="6" y2="10" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="10" x2="10" y2="10" strokeWidth="2" strokeLinecap="round"/>
              <line x1="14" y1="10" x2="14" y2="10" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18" y1="10" x2="18" y2="10" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="14" x2="16" y2="14" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {keyboardVisible ? t('practice:hideKeyboard') : t('practice:showKeyboard')}
          </button>

          {keyboardVisible && (
            <button
              type="button"
              onClick={hideKeyboard}
              className="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center gap-1.5 text-red-600 dark:text-red-400"
              title={t('practice:closeKeyboard')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {t('practice:closeKeyboard')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
