import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Shared review-forecast helpers (kept separate from the component file so the
 * component module only exports components — see react-refresh lint rule).
 */

export interface ForecastDateParts {
  absolute: string
  relative: string
  diffDays: number
}

/**
 * Hook returning a formatter that turns a backend forecast date (YYYY-MM-DD)
 * into an absolute, locale-aware label plus a relative hint (Today / Tomorrow /
 * In N days). Mirrors the relative-date wording used on the Progress page.
 */
export function useForecastDateFormatter() {
  const { t, i18n } = useTranslation(['learner'])

  return useCallback(
    (isoDate: string): ForecastDateParts => {
      const date = new Date(`${isoDate}T00:00:00`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dayMs = 24 * 60 * 60 * 1000
      const diffDays = Math.round((date.getTime() - today.getTime()) / dayMs)

      let relative: string
      if (diffDays <= 0) relative = t('learner:today')
      else if (diffDays === 1) relative = t('learner:tomorrow')
      else relative = t('learner:inDays', { count: diffDays })

      const absolute = new Intl.DateTimeFormat(i18n.language, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(date)

      return { absolute, relative, diffDays }
    },
    [t, i18n.language],
  )
}
