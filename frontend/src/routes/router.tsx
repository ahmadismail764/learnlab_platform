import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout, DashboardLayout } from "@/components/layout";
import type { User } from "@/types";
import { LazyRoute } from "./LazyRoute";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Application Router
 *
 * Route-level code splitting via React.lazy() keeps the initial bundle
 * on demand. Each lazy chunk is wrapped in Suspense with a spinner.
 *
 * Roles:
 * - learner: Primary learner - solves problems, views progress
 * - admin: Content manager - manages questions, monitors analytics
 */

// ── Eagerly loaded (part of initial bundle) ────────────────────────
// Auth pages load fast and are the first thing users see
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "@/pages/auth";

// ── Lazily loaded (split into separate chunks) ─────────────────────
const OnboardingPage = lazy(() =>
  import("@/pages/learner/OnboardingPage.tsx").then((m) => ({ default: m.OnboardingPage }))
);
const LearnerDashboard = lazy(() =>
  import("@/pages/learner/LearnerDashboard.tsx").then((m) => ({ default: m.LearnerDashboard }))
);
const TopicsPage = lazy(() =>
  import("@/pages/learner/TopicsPage.tsx").then((m) => ({ default: m.TopicsPage }))
);
const PracticePage = lazy(() =>
  import("@/pages/learner/PracticePage.tsx").then((m) => ({ default: m.PracticePage }))
);
const ProgressPage = lazy(() =>
  import("@/pages/learner/ProgressPage.tsx").then((m) => ({ default: m.ProgressPage }))
);
const ReviewSchedulePage = lazy(() =>
  import("@/pages/learner/ReviewSchedulePage.tsx").then((m) => ({ default: m.ReviewSchedulePage }))
);
const LeaderboardPage = lazy(() =>
  import("@/pages/learner/LeaderboardPage.tsx").then((m) => ({ default: m.LeaderboardPage }))
);
const LearnerProfilePage = lazy(() =>
  import("@/pages/learner/LearnerProfilePage.tsx").then((m) => ({ default: m.LearnerProfilePage }))
);

const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard.tsx").then((m) => ({ default: m.AdminDashboard }))
);
const TopicsManagementPage = lazy(() =>
  import("@/pages/admin/TopicsManagementPage.tsx").then((m) => ({ default: m.TopicsManagementPage }))
);
const QuestionsPage = lazy(() =>
  import("@/pages/admin/QuestionsPage.tsx").then((m) => ({ default: m.QuestionsPage }))
);
const AnalyticsPage = lazy(() =>
  import("@/pages/admin/AnalyticsPage.tsx").then((m) => ({ default: m.AnalyticsPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/admin/SettingsPage.tsx").then((m) => ({ default: m.SettingsPage }))
);
const AdminProfilePage = lazy(() =>
  import("@/pages/admin/AdminProfilePage.tsx").then((m) => ({ default: m.AdminProfilePage }))
);

/**
 * Helper to create dashboard layout with user.
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
        { path: "reset-password", element: <ResetPasswordPage /> },
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
        { path: "schedule", element: <LazyRoute><ReviewSchedulePage /></LazyRoute> },
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
      element: <NotFoundPage />,
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
