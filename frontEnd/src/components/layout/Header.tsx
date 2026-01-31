import { Bell, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { User } from '@/types'

/**
 * Header Component
 * 
 * Top navigation bar with notifications, language switcher, and user menu.
 * RTL-aware: icons and layout flip automatically.
 * 
 * Note: Search functionality removed - will be added when backend is ready.
 */

export interface HeaderProps {
  /** Current user info */
  user?: User
  /** Page title */
  title?: string
  /** Show mobile menu button */
  showMenuButton?: boolean
  /** Callback when menu button is clicked */
  onMenuClick?: () => void
}

export function Header({
  user,
  title,
  showMenuButton = false,
  onMenuClick,
}: HeaderProps) {
  const { t } = useTranslation()
  
  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Start side (left in LTR, right in RTL) */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {title && (
          <h1 className="text-xl font-semibold text-neutral-800 hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* End side (right in LTR, left in RTL) */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher variant="minimal" />
        
        {/* Notifications - static for now */}
        <button 
          className="relative p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
          aria-label={t('nav:notifications', 'Notifications')}
        >
          <Bell className="w-5 h-5" />
          {/* Notification dot */}
          <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-accent-500 rounded-full" />
        </button>

        {/* User avatar */}
        {user && (
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
            <span className="text-sm font-medium text-neutral-700 hidden sm:block">
              {user.firstName}
            </span>
          </button>
        )}
      </div>
    </header>
  )
}
