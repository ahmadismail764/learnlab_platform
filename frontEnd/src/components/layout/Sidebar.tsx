import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  FileQuestion,
  GraduationCap,
  LogOut,
  ChevronLeft,
  Trophy,
  type LucideIcon
} from 'lucide-react'
import { Avatar } from '@/components/ui'
import type { User, UserRole } from '@/types'

/**
 * Sidebar Component
 * 
 * Main navigation sidebar that adapts based on user role.
 * RTL-aware: layout and chevron flip automatically.
 * Follows Open/Closed principle - extend via navItems config.
 */

export interface SidebarProps {
  /** Current user info */
  user: User
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean
  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: () => void
  /** Callback for logout */
  onLogout?: () => void
}

interface NavItem {
  labelKey: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

// Navigation items configuration - extensible without modifying component
const navItems: NavItem[] = [
  // Student items
  { labelKey: 'nav:dashboard', href: '/student', icon: LayoutDashboard, roles: ['student'] },
  { labelKey: 'nav:topics', href: '/student/topics', icon: BookOpen, roles: ['student'] },
  { labelKey: 'nav:practice', href: '/student/practice', icon: FileQuestion, roles: ['student'] },
  { labelKey: 'nav:progress', href: '/student/progress', icon: BarChart3, roles: ['student'] },
  { labelKey: 'nav:achievements', href: '/student/achievements', icon: Trophy, roles: ['student'] },
  
  // Admin (Content Manager) items
  { labelKey: 'nav:dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  { labelKey: 'nav:questionBank', href: '/admin/questions', icon: FileQuestion, roles: ['admin'] },
  { labelKey: 'nav:analytics', href: '/admin/analytics', icon: BarChart3, roles: ['admin'] },
  { labelKey: 'nav:settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
]

export function Sidebar({ 
  user, 
  isCollapsed = false, 
  onToggleCollapse, 
  onLogout 
}: SidebarProps) {
  const { t } = useTranslation( 'auth' )
  const location = useLocation()
  
  // Filter nav items based on user role
  const visibleItems = navItems.filter(item => item.roles.includes(user.role))

  const roleLabels: Record<UserRole, string> = {
    student: t('auth:student'),
    admin: t('auth:admin'),
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-e border-neutral-200',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-neutral-200',
        isCollapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-lg text-neutral-800">{t('common:appName')}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            const label = t(item.labelKey)
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-colors duration-150',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            'mx-2 mb-2 p-2 rounded-lg text-neutral-500',
            'hover:bg-neutral-100 hover:text-neutral-700',
            'transition-colors duration-150',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? t('nav:expand', 'Expand sidebar') : t('nav:collapse', 'Collapse sidebar')}
        >
          <ChevronLeft className={cn(
            'w-5 h-5 transition-transform duration-300',
            // In RTL, chevron should point opposite direction
            isCollapsed && 'ltr:rotate-180 rtl:-rotate-180'
          )} />
        </button>
      )}

      {/* User section */}
      <div className={cn(
        'border-t border-neutral-200 p-4',
        isCollapsed && 'px-2'
      )}>
        <div className={cn(
          'flex items-center',
          isCollapsed ? 'justify-center' : 'gap-3'
        )}>
          <Avatar 
            name={`${user.firstName} ${user.lastName}`} 
            src={user.avatarUrl} 
            size="sm"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-neutral-500">
                {roleLabels[user.role]}
              </p>
            </div>
          )}
          {!isCollapsed && onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              title={t('nav:logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
