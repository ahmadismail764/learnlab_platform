import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, X, Trophy, BookOpen, Zap, Clock, User as UserIcon, LogOut, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { IntegrationStatusBadge } from '@/components/common'
import { useAuth } from '@/contexts'
import type { User } from '@/types'

/**
 * Header Component
 * 
 * Top navigation bar with notifications, language switcher, theme toggle, and user menu.
 * RTL-aware: icons and layout flip automatically.
 */

interface Notification {
  id: string
  type: 'achievement' | 'reminder' | 'milestone' | 'tip'
  title: string
  message: string
  time: string
  read: boolean
}

// Hardcoded notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You earned "Topic Master" for reaching 90% mastery in Propositional Logic',
    time: '2 hours ago',
    read: false
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Topics Due for Review',
    message: '3 topics are due for review today. Keep your knowledge fresh!',
    time: '5 hours ago',
    read: false
  },
  {
    id: '3',
    type: 'milestone',
    title: 'Weekly Milestone',
    message: 'You answered 50 questions this week! Great progress!',
    time: '1 day ago',
    read: true
  },
  {
    id: '4',
    type: 'tip',
    title: 'Study Tip',
    message: 'Review Set Operations before moving to Cartesian Products',
    time: '2 days ago',
    read: true
  }
]

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
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { logout } = useAuth()

  const unreadCount = notifications.filter(n => !n.read).length

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-4 h-4 text-accent-500" />
      case 'reminder': return <Clock className="w-4 h-4 text-primary-500" />
      case 'milestone': return <Zap className="w-4 h-4 text-green-500" />
      case 'tip': return <BookOpen className="w-4 h-4 text-secondary-500" />
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Start side (left in LTR, right in RTL) */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {title && (
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 hidden sm:block">
            {title}
          </h1>
        )}
        <div className="hidden md:block">
          <IntegrationStatusBadge compact />
        </div>
      </div>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* End side (right in LTR, left in RTL) */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)} 
              />
              
              {/* Panel */}
              <div className="absolute end-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Notifications</h3>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-2 py-1"
                      >
                        Mark all read
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      aria-label="Close notifications"
                      title="Close notifications"
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto scrollbar-styled">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        aria-label={`Notification: ${notification.title}`}
                        className={`w-full p-4 text-start hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b border-neutral-50 dark:border-neutral-800 last:border-0 transition-colors ${
                          !notification.read ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Switcher */}
        <LanguageSwitcher variant="globe" />

        {/* User avatar → Profile dropdown */}
        {user && (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden sm:block">
                {user.firstName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute end-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden py-1">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      to={`/${user.role}/profile`}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-400" />
                      Profile
                    </Link>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        logout()
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
