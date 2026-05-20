import { lazy } from "react";
import { createBrowserRouter, Link, Navigate } from "react-router-dom";
import { AuthLayout, DashboardLayout } from "@/components/layout";
import type { User } from "@/types";
import { LazyRoute } from "./LazyRoute";

/**
 * Application Router
 *
 * Route-level code splitting via React.lazy() keeps the initial bundle
 * small. Heavy pages (especially PracticePage with mathlive) are loaded
 * on demand. Each lazy chunk is wrapped in Suspense with a spinner.
 *
 * Roles:
 * - learner: Primary learner - solves problems, views progress
 * - admin: Content manager - manages questions, monitors analytics
 */

// ── Eagerly loaded (part of initial bundle) ────────────────────────
// Auth pages load fast and are the first thing users see
import { ForgotPasswordPage, LoginPage, RegisterPage } from "@/pages/auth";

// ── Lazily loaded (split into separate chunks) ─────────────────────
const OnboardingPage = lazy(() =>
  import("@/pages/learner/OnboardingPage").then((m) => ({ default: m.OnboardingPage }))
);
const LearnerDashboard = lazy(() =>
  import("@/pages/learner/LearnerDashboard").then((m) => ({ default: m.LearnerDashboard }))
);
const TopicsPage = lazy(() =>
  import("@/pages/learner/TopicsPage").then((m) => ({ default: m.TopicsPage }))
);
const PracticePage = lazy(() =>
  import("@/pages/learner/PracticePage").then((m) => ({ default: m.PracticePage }))
);
const ProgressPage = lazy(() =>
  import("@/pages/learner/ProgressPage").then((m) => ({ default: m.ProgressPage }))
);
const LeaderboardPage = lazy(() =>
  import("@/pages/learner/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage }))
);
const LearnerProfilePage = lazy(() =>
  import("@/pages/learner/LearnerProfilePage").then((m) => ({ default: m.LearnerProfilePage }))
);

const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
const TopicsManagementPage = lazy(() =>
  import("@/pages/admin/TopicsManagementPage").then((m) => ({ default: m.TopicsManagementPage }))
);
const QuestionsPage = lazy(() =>
  import("@/pages/admin/QuestionsPage").then((m) => ({ default: m.QuestionsPage }))
);
const AnalyticsPage = lazy(() =>
  import("@/pages/admin/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const AdminProfilePage = lazy(() =>
  import("@/pages/admin/AdminProfilePage").then((m) => ({ default: m.AdminProfilePage }))
);

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
      role={requiredRole}
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
        { path: "forgot-password", element: <ForgotPasswordPage /> },
      ],
    },

    // Learner routes
    {
      path: "/learner",
      element: createDashboardElement(user, "learner", onLogout),
      children: [
        { index: true, element: <LazyRoute><LearnerDashboard /></LazyRoute> },
        { path: "onboarding", element: <LazyRoute><OnboardingPage /></LazyRoute> },
        { path: "topics", element: <LazyRoute><TopicsPage /></LazyRoute> },
        { path: "practice", element: <LazyRoute><PracticePage /></LazyRoute> },
        { path: "progress", element: <LazyRoute><ProgressPage /></LazyRoute> },
        { path: "leaderboard", element: <LazyRoute><LeaderboardPage /></LazyRoute> },
        { path: "profile", element: <LazyRoute><LearnerProfilePage /></LazyRoute> },
      ],
    },

    // Admin (Content Manager) routes
    {
      path: "/admin",
      element: createDashboardElement(user, "admin", onLogout),
      children: [
        { index: true, element: <LazyRoute><AdminDashboard /></LazyRoute> },
        { path: "topics", element: <LazyRoute><TopicsManagementPage /></LazyRoute> },
        { path: "questions", element: <LazyRoute><QuestionsPage /></LazyRoute> },
        { path: "analytics", element: <LazyRoute><AnalyticsPage /></LazyRoute> },
        { path: "settings", element: <LazyRoute><SettingsPage /></LazyRoute> },
        { path: "profile", element: <LazyRoute><AdminProfilePage /></LazyRoute> },
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
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 mt-4 inline-block"
            >
              Go home
            </Link>
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
