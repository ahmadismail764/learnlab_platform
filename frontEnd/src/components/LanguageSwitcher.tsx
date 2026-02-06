import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { 
  supportedLanguages, 
  languageConfig, 
  changeLanguage,
  type SupportedLanguage 
} from '@/i18n'
import { cn } from '@/utils/cn'

/**
 * LanguageSwitcher Component
 * 
 * Provides easy language switching between English and Arabic.
 * Multiple display variants for different layouts.
 */

interface LanguageSwitcherProps {
  /** Display variant */
  variant?: 'globe' | 'dropdown' | 'toggle' | 'buttons' | 'minimal'
  /** Additional CSS classes */
  className?: string
  /** Show language names or just flags/icons */
  showLabel?: boolean
}

export function LanguageSwitcher({ 
  variant = 'globe', 
  className,
  showLabel = true 
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const currentLang = i18n.language as SupportedLanguage

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [isOpen])

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await changeLanguage(lang)
    setIsOpen(false)
  }

  // Globe variant - earth icon with dropdown (default, recommended)
  if (variant === 'globe') {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
            'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
          )}
          title="Change language"
          aria-label="Change language"
          aria-expanded={isOpen}
        >
          <Globe className="w-5 h-5" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown */}
            <div className={cn(
              'absolute top-full mt-1 py-1 min-w-[140px]',
              'bg-white dark:bg-neutral-800 rounded-lg shadow-lg',
              'border border-neutral-200 dark:border-neutral-700',
              'z-50',
              'ltr:right-0 rtl:left-0'
            )}>
              {supportedLanguages.map((lang) => {
                const config = languageConfig[lang]
                const isActive = currentLang === lang
                
                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-start flex items-center justify-between gap-2',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors',
                      isActive 
                        ? 'text-primary-600 dark:text-primary-400 font-medium' 
                        : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    <span>{config.nativeName}</span>
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // Toggle variant - simple switch between 2 languages
  if (variant === 'toggle') {
    const nextLang = currentLang === 'en' ? 'ar' : 'en'
    const nextConfig = languageConfig[nextLang]
    
    return (
      <button
        onClick={() => handleLanguageChange(nextLang)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'text-sm font-medium text-neutral-600 dark:text-neutral-400',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          className
        )}
        title={`Switch to ${nextConfig.name}`}
      >
        <Globe className="w-4 h-4" />
        {showLabel && (
          <span>{nextConfig.nativeName}</span>
        )}
      </button>
    )
  }

  // Minimal variant - just icon that cycles
  if (variant === 'minimal') {
    const nextLang = currentLang === 'en' ? 'ar' : 'en'
    
    return (
      <button
        onClick={() => handleLanguageChange(nextLang)}
        className={cn(
          'p-2 rounded-lg',
          'text-neutral-500 dark:text-neutral-400',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          className
        )}
        title={languageConfig[nextLang].name}
        aria-label={`Switch to ${languageConfig[nextLang].name}`}
      >
        <Globe className="w-5 h-5" />
      </button>
    )
  }

  // Buttons variant - all languages visible
  if (variant === 'buttons') {
    return (
      <div className={cn(
        'flex gap-1 p-1 rounded-lg',
        'bg-neutral-100 dark:bg-neutral-800',
        className
      )}>
        {supportedLanguages.map((lang) => {
          const config = languageConfig[lang]
          const isActive = currentLang === lang
          
          return (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              )}
            >
              {showLabel ? config.nativeName : lang.toUpperCase()}
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown variant (legacy)
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'text-sm font-medium text-neutral-600 dark:text-neutral-400',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
        )}
      >
        <Globe className="w-4 h-4" />
        {showLabel && (
          <span>{languageConfig[currentLang]?.nativeName}</span>
        )}
        <svg 
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={cn(
          'absolute top-full mt-1 py-1 min-w-[140px]',
          'bg-white dark:bg-neutral-800 rounded-lg shadow-lg',
          'border border-neutral-200 dark:border-neutral-700',
          'z-50',
          'ltr:right-0 rtl:left-0'
        )}>
          {supportedLanguages.map((lang) => {
            const config = languageConfig[lang]
            const isActive = currentLang === lang
            
            return (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  'w-full px-4 py-2 text-sm text-start',
                  'hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors',
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400 font-medium' 
                    : 'text-neutral-700 dark:text-neutral-300'
                )}
              >
                {config.nativeName}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * useLanguage hook
 * 
 * Provides current language info and change function.
 */
export function useLanguage() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language as SupportedLanguage
  const config = languageConfig[currentLang] || languageConfig.en
  
  return {
    language: currentLang,
    dir: config.dir,
    isRTL: config.dir === 'rtl',
    config,
    changeLanguage,
    supportedLanguages,
  }
}
