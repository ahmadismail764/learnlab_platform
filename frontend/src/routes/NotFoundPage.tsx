import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-300">404</h1>
        <p className="text-neutral-600 mt-2">{t('pageNotFound')}</p>
        <Link
          to="/"
          className="text-primary-600 hover:text-primary-700 mt-4 inline-block"
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  )
}
