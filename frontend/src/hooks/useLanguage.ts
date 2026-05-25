import { useTranslation } from 'react-i18next'
import {
  changeLanguage,
  languageConfig,
  supportedLanguages,
  type SupportedLanguage,
} from '@/i18n'

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

