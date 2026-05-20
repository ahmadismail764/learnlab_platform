import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, GraduationCap, CheckCircle, Copy } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/contexts";
import { useToast } from "@/contexts";
import { AuthRequestError } from "@/services/auth";

/**
 * LoginPage — UC-02
 *
 * Flow:
 * 1. User opens LearnLab → system shows login form
 * 2. User enters username/password
 * 3. System validates credentials
 * 4. System authenticates user
 *    - If learner → redirect to learner dashboard
 *    - If admin   → redirect to admin dashboard
 *
 * Alternate Flows:
 * 4a. Invalid credentials → "Invalid username or password" + remaining attempts
 * 4b. Account locked → notify user after 5 failed attempts, show lockout timer
 */

/** Quick-fill accounts for the login form */
const TEST_ACCOUNTS = [
  {
    label: "Learner",
    icon: GraduationCap,
    username: "testlearner",
    password: "testpass123",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  },
  {
    label: "Admin",
    icon: ShieldCheck,
    username: "admin",
    password: "admin123",
    color: "text-primary-600 dark:text-primary-400",
    bg: "hover:bg-primary-50 dark:hover:bg-primary-950/30",
  },
];

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { showSuccess } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Show success banner when redirected from registration
  const justRegistered = searchParams.get("registered") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError(t("auth:fieldRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({ email: identifier.trim(), password, rememberMe });
      showSuccess(t("auth:loginSuccess", { name: user.firstName || user.username }));
      const nextRoute = user.role === "admin" ? "/admin" : "/learner";
      navigate(nextRoute, { replace: true });
    } catch (err: unknown) {
      if (err instanceof AuthRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        // Network / unexpected errors
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          setError(t("auth:serverUnreachable"));
        } else {
          setError(err.message);
        }
      } else {
        setError(t("auth:loginFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /** Quick-fill a test account */
  const fillAccount = (account: typeof TEST_ACCOUNTS[number]) => {
    setIdentifier(account.username);
    setPassword(account.password);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("auth:welcomeBack")}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t("auth:loginFlowDescription")}
        </p>
      </div>

      {/* Registration success banner */}
      {justRegistered && (
        <Card
          className="border-green-200 bg-green-50/80 dark:border-green-900/60 dark:bg-green-950/30"
          padding="sm"
        >
          <div className="flex items-center gap-3 text-sm text-green-800 dark:text-green-200">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
            <p>{t("auth:registrationSuccessLogin")}</p>
          </div>
        </Card>
      )}

      {/* Test accounts quick-fill */}
      <Card
        className="border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40"
        padding="sm"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
          {t("auth:testAccounts")}
        </p>
        <div className="space-y-2">
          {TEST_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            return (
              <button
                key={account.username}
                type="button"
                onClick={() => fillAccount(account)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-colors group ${account.bg}`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${account.color}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {account.label}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 ms-2">
                    {account.username}
                  </span>
                </div>
                <Copy className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("auth:emailOrUsername")}
          type="text"
          placeholder={t("auth:emailPlaceholder")}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
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
          <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 fade-in duration-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
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
    </div>
  );
}
