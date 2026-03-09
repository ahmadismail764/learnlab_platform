import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout, DashboardLayout } from '@/components/layout'
import { useAuth } from '@/contexts'
import { 
  LoginPage, 
  RegisterPage, 
  StudentDashboard, 
  AdminDashboard, 
  PracticePage, 
  TopicsPage,
  ProgressPage,
  AchievementsPage,
  StudentProfilePage,
  QuestionsPage,
  AnalyticsPage,
  SettingsPage,
  AdminProfilePage,
  LeaderboardPage,
  TopicsManagementPage,
} from '@/pages'
import type { User } from '@/types'

/**
 * Application Router
 * 
 * Defines all routes and their associated layouts.
 * Protected routes are handled by checking auth state.
 * 
 * Roles:
 * - student: Primary learner - solves problems, views progress
 * - admin: Content manager - manages questions, monitors analytics
 */


// 1. Define routes statically (outside of the factory)
const routesConfig = [
  // Public routes - Auth
  {
    path: '/',
    // Logic will be inside the component to handle user state
    element: <AuthRouteWrapper />,
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
    element: <ProtectedRouteWrapper role="student" />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'topics', element: <TopicsPage /> },
      { path: 'practice', element: <PracticePage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'achievements', element: <AchievementsPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },

  // Admin (Content Manager) routes
  {
    path: '/admin',
    element: <ProtectedRouteWrapper role="admin" />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'topics', element: <TopicsManagementPage /> },
      { path: 'questions', element: <QuestionsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
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
]

// 2. Component Wrappers to handle Auth inside the stable router
function ProtectedRouteWrapper({ role }: { role: User['role'] }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return null
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={getDefaultRoute(user.role)} replace />
  
  return <DashboardLayout user={user} />
}

function AuthRouteWrapper() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return null
  if (isAuthenticated && user) return <Navigate to={getDefaultRoute(user.role)} replace />
  
  return <AuthLayout />
}

// Global router instance (singleton)
export const router = createBrowserRouter(routesConfig)

// Factory function remains for backward compatibility but is simplified
export function createAppRouter(_user: User | null) {
  return router
}

// Get default route based on user role
function getDefaultRoute(role: User['role']): string {
  const routes: Record<User['role'], string> = {
    student: '/student',
    admin: '/admin',
  }
  return routes[role]
}
