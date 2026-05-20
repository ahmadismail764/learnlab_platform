import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, type SidebarProps } from './Sidebar'
import { Header } from './Header'
import { DataSourceBreakdown, ErrorBoundary } from '@/components/common'
import { cn } from '@/utils/cn'
import type { UserRole } from '@/types'

/**
 * DashboardLayout Component
 * 
 * Main layout wrapper for authenticated pages.
 * Includes sidebar navigation and header.
 * Supports dark mode.
 */

export interface DashboardLayoutProps {
  /** User info passed to sidebar */
  user: SidebarProps['user']
  /** Dashboard role for role-specific layout treatment */
  role?: UserRole
  /** Page title shown in header */
  pageTitle?: string
  /** Callback for logout */
  onLogout?: () => void
}

export function DashboardLayout({
  user,
  role = user.role,
  pageTitle,
  onLogout,
}: DashboardLayoutProps) {
  const isDashboard = Boolean(role)
  const showDataSourceBreakdown = false
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement

    root.setAttribute('data-dashboard-role', role)

    return () => {
      if (root.getAttribute('data-dashboard-role') === role) {
        root.removeAttribute('data-dashboard-role')
      }
    }
  }, [role])

  return (
    <div
      className="h-screen bg-neutral-50 dark:bg-neutral-950 flex overflow-hidden"
      data-dashboard-role={role}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar
          user={user}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={onLogout}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 start-0 z-50 w-64">
            <Sidebar
              user={user}
              isCollapsed={false}
              onLogout={onLogout}
            />
            {/* Close button - positioned at top-end corner of the sidebar */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 end-3 p-1.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-700/80 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors z-[60]"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className={cn('flex-1 flex flex-col min-w-0', isDashboard && 'dashboard-shell')}>
        <Header
          user={user}
          title={pageTitle}
          showMenuButton
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        {/* Page content */}
        <main className={cn(
          'flex-1 overflow-y-auto',
          isDashboard ? 'px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7' : 'p-4 sm:p-6 lg:p-8',
        )}>
          <div className={cn('w-full', isDashboard && 'mx-auto max-w-[1420px] space-y-6 xl:space-y-7')}>
            {showDataSourceBreakdown && (
              <div className="mb-6">
                <DataSourceBreakdown compact />
              </div>
            )}
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
