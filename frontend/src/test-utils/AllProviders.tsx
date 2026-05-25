import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import type { User } from '@/types'

export function AllProviders({
  children,
  user = null,
  withRouter = true,
}: {
  children: ReactNode
  user?: User | null
  withRouter?: boolean
}) {
  const content = (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider initialUser={user}>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  )

  if (withRouter) {
    return <BrowserRouter>{content}</BrowserRouter>
  }

  return content
}

