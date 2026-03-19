import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, type SidebarProps } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/utils/cn'

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
  /** Page title shown in header */
  pageTitle?: string
  /** Callback for logout */
  onLogout?: () => void
}

export function DashboardLayout({ user, pageTitle, onLogout }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen bg-neutral-50 dark:bg-neutral-950 flex overflow-hidden">
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
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          title={pageTitle}
          showMenuButton
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        {/* Page content */}
        <main className={cn(
          'flex-1 p-4 sm:p-6 lg:p-8',
          'overflow-y-auto'
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
