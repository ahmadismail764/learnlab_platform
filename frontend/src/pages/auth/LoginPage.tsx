import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, GraduationCap } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts";

/**
 * LoginPage — UC-02
 *
 * Flow:
 * 1. User opens LearnLab → system shows login form
 * 2. User enters email/password
 * 3. System validates credentials
 * 4. System authenticates user
 *    - If learner → redirect to learner dashboard
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsLoading(true);

    try {
      const user = await login({ email, password });
      const nextRoute = user.role === "admin" ? "/admin" : "/learner";
      navigate(nextRoute, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("auth:invalidCredentials");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Switcher & Theme Toggle - top right */}
      <div className="absolute top-4 end-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher variant="globe" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("auth:welcomeBack")}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t("auth:loginFlowDescription")}
        </p>
      </div>

      <Card
        className="border-primary-100 bg-primary-50/80 dark:border-primary-900/60 dark:bg-primary-950/30"
        padding="sm"
      >
        <div className="space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-0.5 h-4 w-4 text-primary-600 dark:text-primary-400" />
            <p>{t("auth:learnerLoginHint")}</p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary-600 dark:text-primary-400" />
            <p>{t("auth:adminLoginHint")}</p>
          </div>
        </div>
      </Card>

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

      <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
        {t("auth:seededLearnerHint")}
      </p>
    </div>
  );
}
