import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout, DashboardLayout } from "@/components/layout";
import {
  LoginPage,
  RegisterPage,
  LearnerDashboard,
  AdminDashboard,
  PracticePage,
  TopicsPage,
  ProgressPage,
  LearnerProfilePage,
  QuestionsPage,
  AnalyticsPage,
  SettingsPage,
  AdminProfilePage,
  LeaderboardPage,
  TopicsManagementPage,
} from "@/pages";
import type { User } from "@/types";

/**
 * Application Router
 *
 * Defines all routes and their associated layouts.
 * Protected routes are handled by checking auth state.
 *
 * Roles:
 * - learner: Primary learner - solves problems, views progress
 * - admin: Content manager - manages questions, monitors analytics
 */

/**
 * Helper to create dashboard layout with user.
 * onLogout is provided by App.tsx from AuthContext.
 */
function createDashboardElement(
  user: User | null,
  requiredRole: User["role"],
  onLogout?: () => void,
) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout ?? (() => {})}
    />
  );
}

// Factory function to create router with current user
export function createAppRouter(user: User | null, onLogout?: () => void) {
  return createBrowserRouter([
    // Public routes - Auth
    {
      path: "/",
      element: user ? (
        <Navigate to={getDefaultRoute(user.role)} replace />
      ) : (
        <AuthLayout />
      ),
      children: [
        { index: true, element: <Navigate to="/login" replace /> },
        { path: "login", element: <LoginPage /> },
        { path: "register", element: <RegisterPage /> },
        {
          path: "forgot-password",
          element: (
            <div className="text-center">Forgot Password (Coming Soon)</div>
          ),
        },
      ],
    },

    // Learner routes
    {
      path: "/learner",
      element: createDashboardElement(user, "learner", onLogout),
      children: [
        { index: true, element: <LearnerDashboard /> },
        { path: "topics", element: <TopicsPage /> },
        { path: "practice", element: <PracticePage /> },
        { path: "progress", element: <ProgressPage /> },

        { path: "leaderboard", element: <LeaderboardPage /> },
        { path: "profile", element: <LearnerProfilePage /> },
      ],
    },

    // Admin (Content Manager) routes
    {
      path: "/admin",
      element: createDashboardElement(user, "admin", onLogout),
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: "topics", element: <TopicsManagementPage /> },
        { path: "questions", element: <QuestionsPage /> },
        { path: "analytics", element: <AnalyticsPage /> },
        { path: "settings", element: <SettingsPage /> },
        { path: "profile", element: <AdminProfilePage /> },
      ],
    },

    // Catch all - 404
    {
      path: "*",
      element: (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-neutral-300">404</h1>
            <p className="text-neutral-600 mt-2">Page not found</p>
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 mt-4 inline-block"
            >
              Go home
            </a>
          </div>
        </div>
      ),
    },
  ]);
}

// Get default route based on user role
function getDefaultRoute(role: User["role"]): string {
  const routes: Record<User["role"], string> = {
    learner: "/learner",
    admin: "/admin",
  };
  return routes[role];
}
