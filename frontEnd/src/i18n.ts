import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// English translations - split by namespace
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enNav from './locales/en/nav.json'
import enStudent from './locales/en/student.json'
import enAdmin from './locales/en/admin.json'
import enPractice from './locales/en/practice.json'
import enGamification from './locales/en/gamification.json'
import enTime from './locales/en/time.json'
import enTopics from './locales/en/topics.json'
import enLanguage from './locales/en/language.json'
import enProfile from './locales/en/profile.json'

// Arabic translations - split by namespace
import arCommon from './locales/ar/common.json'
import arAuth from './locales/ar/auth.json'
import arNav from './locales/ar/nav.json'
import arStudent from './locales/ar/student.json'
import arAdmin from './locales/ar/admin.json'
import arPractice from './locales/ar/practice.json'
import arGamification from './locales/ar/gamification.json'
import arTime from './locales/ar/time.json'
import arTopics from './locales/ar/topics.json'
import arLanguage from './locales/ar/language.json'
import arProfile from './locales/ar/profile.json'

/**
 * i18n Configuration
 * 
 * Sets up internationalization with:
 * - English (LTR) and Arabic (RTL) support
 * - Namespace-based translation file organization
 * - Browser language detection
 * - Local storage persistence
 * 
 * Namespaces:
 * - common: Shared UI elements (buttons, labels, errors)
 * - auth: Authentication related (login, register, etc.)
 * - nav: Navigation menu items
 * - student: Student dashboard and features
 * - admin: Admin/System admin features
 * - practice: Practice session and questions
 * - gamification: XP, streaks, achievements
 * - time: Time-related strings
 * - topics: Course topics (Discrete Mathematics)
 * - language: Language switcher
 */

export const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

/** Available translation namespaces */
export const namespaces = [
  'common',
  'auth', 
  'nav',
  'student',
  'admin',
  'practice',
  'gamification',
  'time',
  'topics',
  'language',
  'profile',
] as const
export type Namespace = typeof namespaces[number]

export const languageConfig: Record<SupportedLanguage, { 
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
  fontFamily?: string
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    fontFamily: "'Tajawal', 'Noto Sans Arabic', 'Segoe UI', sans-serif",
  },
}

// Resources organized by language and namespace
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    nav: enNav,
    student: enStudent,
    admin: enAdmin,
    practice: enPractice,
    gamification: enGamification,
    time: enTime,
    topics: enTopics,
    language: enLanguage,
    profile: enProfile,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    nav: arNav,
    student: arStudent,
    admin: arAdmin,
    practice: arPractice,
    gamification: arGamification,
    time: arTime,
    topics: arTopics,
    language: arLanguage,
    profile: arProfile,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    
    // Default namespace
    defaultNS: 'common',
    ns: namespaces,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'learnlab_language',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  })

/**
 * Get current language direction
 */
export function getLanguageDir(lang?: string): 'ltr' | 'rtl' {
  const currentLang = (lang || i18n.language) as SupportedLanguage
  return languageConfig[currentLang]?.dir || 'ltr'
}

/**
 * Check if current language is RTL
 */
export function isRTL(lang?: string): boolean {
  return getLanguageDir(lang) === 'rtl'
}

/**
 * Change language and update document direction
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang)
  updateDocumentDirection(lang)
}

/**
 * Update document direction and lang attribute
 */
export function updateDocumentDirection(lang: SupportedLanguage): void {
  const config = languageConfig[lang]
  document.documentElement.dir = config.dir
  document.documentElement.lang = lang
  
  if (config.fontFamily) {
    document.documentElement.style.setProperty('--font-arabic', config.fontFamily)
  }
}

// Initialize document direction on load
if (typeof window !== 'undefined') {
  const currentLang = i18n.language as SupportedLanguage
  if (supportedLanguages.includes(currentLang)) {
    updateDocumentDirection(currentLang)
  }
}

export default i18n
