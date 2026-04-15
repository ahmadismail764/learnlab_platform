import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts";
import {
  addAdminOverrideEmail,
  removeAdminOverrideEmail,
} from "@/utils/adminOverride";

/**
 * LoginPage — UC-02
 *
 * Flow:
 * 1. User opens LearnLab → system shows login form
 * 2. User enters email/password
 * 3. System validates credentials
 * 4. System authenticates user
 *    - If student → redirect to student dashboard
 *    - If admin   → redirect to admin dashboard
 *
 * Alternate Flows:
 * 4a. Invalid credentials → "Invalid email or password" + remaining attempts
 * 4b. Account locked → notify user after 5 failed attempts, show lockout timer
 */

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [useAdminTestingMode, setUseAdminTestingMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "idle" | "requesting" | "ok" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBackendStatus("requesting");

    setIsLoading(true);

    try {
      if (useAdminTestingMode) {
        addAdminOverrideEmail(email);
      } else {
        removeAdminOverrideEmail(email);
      }

      const user = await login({ email, password });
      setBackendStatus("ok");
      const nextRoute = user.role === "admin" ? "/admin" : "/student";
      navigate(nextRoute, { replace: true });
    } catch (err: unknown) {
      setBackendStatus("error");
      const message =
        err instanceof Error ? err.message : t("auth:invalidCredentials");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Language Switcher & Theme Toggle - top right */}
      <div className="absolute top-4 end-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher variant="globe" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
        {t("auth:welcomeBack")}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        {t("auth:enterCredentials")}
      </p>

      <div className="mb-4 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-300">
        <p className="font-medium">Backend Auth Status</p>
        {backendStatus === "idle" && <p>Ready to send login request.</p>}
        {backendStatus === "requesting" && (
          <p>Sending login request to backend...</p>
        )}
        {backendStatus === "ok" && <p>Login successful. Redirecting...</p>}
        {backendStatus === "error" && (
          <p>Backend returned an error. See details below.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("auth:email")}
          type="email"
          placeholder={t("auth:emailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label={t("auth:password")}
          type={showPassword ? "text" : "password"}
          placeholder={t("auth:passwordPlaceholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
          required
        />

        {error && (
          <p className="text-sm text-error bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800"
            />
            <span className="text-neutral-600 dark:text-neutral-400">
              {t("auth:rememberMe")}
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            {t("auth:forgotPassword")}
          </Link>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={useAdminTestingMode}
            onChange={(e) => setUseAdminTestingMode(e.target.checked)}
            className="rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 mt-0.5"
          />
          <span className="text-amber-700 dark:text-amber-300">
            Enable temporary admin access for this email (frontend testing mode)
          </span>
        </label>

        <Button type="submit" fullWidth isLoading={isLoading}>
          {t("auth:signIn")}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
        {t("auth:noAccount")}{" "}
        <Link
          to="/register"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          {t("auth:signUp")}
        </Link>
      </p>

      {/* Development helper */}
      <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          🧪 {t("auth:testAccounts")}:
        </p>
        <div className="space-y-1 text-neutral-600 dark:text-neutral-400">
          <p>{t("auth:student")}: student@learnlab.com / Student123!</p>
          <p>{t("auth:admin")}: admin@learnlab.com / Admin123!</p>
        </div>
      </div>
    </div>
  );
}
