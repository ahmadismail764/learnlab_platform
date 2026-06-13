import { useMemo, Suspense, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import {
  AuthProvider,
  ToastProvider,
  ThemeProvider,
  useAuth,
} from "@/contexts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryProvider } from "@/contexts/QueryProvider";
import { PageLoader } from "@/components/ui";
import { createAppRouter } from "@/routes";
import { useApiErrorInterceptor } from "@/hooks/useApiErrorInterceptor";

/**
 * Helper to parse backend-supplied HSL string coordinates
 * e.g. "hsl(210, 70%, 50%)"
 */
function parseHsl(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString.match(/hsl\(\s*(\d+)(?:deg)?[\s,]+(\d+)%[\s,]+(\d+)%\s*\)/i);
  if (!match) return null;
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
  };
}

/**
 * App Root Component
 *
 * Sets up providers, error boundary, i18n Suspense, and routing.
 */

function AppRouter() {
  const { user, logout } = useAuth();
  useApiErrorInterceptor();

  // Dynamic brand theme accent based on user.avatarColor
  useEffect(() => {
    const root = document.documentElement;
    if (user?.avatarColor) {
      const parsed = parseHsl(user.avatarColor);
      if (parsed) {
        root.style.setProperty('--brand-hue', `${parsed.h}`);
        root.style.setProperty('--brand-saturation', `${parsed.s}%`);
        return;
      }
    }
    // Fallback / Reset to default Scientific Teal brand color
    root.style.removeProperty('--brand-hue');
    root.style.removeProperty('--brand-saturation');
  }, [user?.avatarColor]);

  const router = useMemo(() => createAppRouter(user, logout), [user, logout]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                <AppRouter />
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>
  );
}
