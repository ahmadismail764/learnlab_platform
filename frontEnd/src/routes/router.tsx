import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout, DashboardLayout } from '@/components/layout'
import { LoginPage, RegisterPage, StudentDashboard, AdminDashboard } from '@/pages'
import type { User } from '@/types'

/**
 * Application Router
 * 
 * Defines all routes and their associated layouts.
 * Protected routes are handled by checking auth state.
 * 
 * Roles:
 * - student: Primary learner
 * - admin: System admin / Content manager  
 * - supervisor: Academic advisor / Content reviewer
 */

// Helper to create dashboard layout with user
function createDashboardElement(user: User | null) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <DashboardLayout 
      user={user}
      onLogout={() => {
        // Will be handled by context in real implementation
        window.location.href = '/login'
      }}
    />
  )
}

// Factory function to create router with current user
export function createAppRouter(user: User | null) {
  return createBrowserRouter([
    // Public routes - Auth
    {
      path: '/',
      element: user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <AuthLayout />,
      children: [
        { index: true, element: <Navigate to="/login" replace /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'register', element: <RegisterPage /> },
        { path: 'forgot-password', element: <div className="text-center">Forgot Password (Coming Soon)</div> },
      ],
    },

    // Student routes
    {
      path: '/student',
      element: createDashboardElement(user),
      children: [
        { index: true, element: <StudentDashboard /> },
        { path: 'topics', element: <PlaceholderPage title="Topics" description="Topic browser for Discrete Mathematics" /> },
        { path: 'practice', element: <PlaceholderPage title="Practice Session" description="Practice interface with MathLive keyboard" /> },
        { path: 'progress', element: <PlaceholderPage title="My Progress" description="FSRS-based progress tracking" /> },
        { path: 'achievements', element: <PlaceholderPage title="Achievements" description="XP, streaks, and badges" /> },
      ],
    },

    // Admin (System Admin / Content Manager) routes
    {
      path: '/admin',
      element: createDashboardElement(user),
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: 'questions', element: <PlaceholderPage title="Question Bank" description="Manage questions by topic and difficulty tier" /> },
        { path: 'users', element: <PlaceholderPage title="User Management" description="Manage students and supervisors" /> },
        { path: 'analytics', element: <PlaceholderPage title="System Analytics" description="Platform usage and performance metrics" /> },
        { path: 'settings', element: <PlaceholderPage title="System Settings" description="System configuration" /> },
      ],
    },

    // Supervisor (Academic Advisor) routes
    {
      path: '/supervisor',
      element: createDashboardElement(user),
      children: [
        { index: true, element: <PlaceholderPage title="Supervisor Dashboard" description="Content review overview" /> },
        { path: 'review', element: <PlaceholderPage title="Content Review" description="Review pedagogical validity of questions" /> },
        { path: 'reports', element: <PlaceholderPage title="Reports" description="Academic performance reports" /> },
      ],
    },

    // Catch all - 404
    {
      path: '*',
      element: (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-neutral-300">404</h1>
            <p className="text-neutral-600 mt-2">Page not found</p>
            <a href="/" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
              Go home
            </a>
          </div>
        </div>
      ),
    },
  ])
}

// Get default route based on user role
function getDefaultRoute(role: User['role']): string {
  const routes: Record<User['role'], string> = {
    student: '/student',
    admin: '/admin',
    supervisor: '/supervisor',
  }
  return routes[role]
}

// Placeholder component for routes not yet implemented
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-2">{title}</h2>
      <p className="text-neutral-600">{description}</p>
    </div>
  )
}
