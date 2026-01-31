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
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
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
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar
              user={user}
              isCollapsed={false}
              onLogout={onLogout}
            />
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
