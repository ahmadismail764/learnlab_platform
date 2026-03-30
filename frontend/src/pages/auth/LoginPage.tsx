<<<<<<< HEAD
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts'
import { addAdminOverrideEmail, removeAdminOverrideEmail } from '@/utils/adminOverride'
=======
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts";
import type { User, UserRole } from "@/types";
>>>>>>> backend-updates

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

<<<<<<< HEAD
export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [useAdminTestingMode, setUseAdminTestingMode] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'idle' | 'requesting' | 'ok' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBackendStatus('requesting')

    setIsLoading(true)

    try {
      if (useAdminTestingMode) {
        addAdminOverrideEmail(email)
      } else {
        removeAdminOverrideEmail(email)
      }

      const user = await login({ email, password })
      setBackendStatus('ok')
      const nextRoute = user.role === 'admin' ? '/admin' : '/student'
      navigate(nextRoute, { replace: true })
    } catch (err: unknown) {
      setBackendStatus('error')
      const message = err instanceof Error ? err.message : t('auth:invalidCredentials')
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Language Switcher & Theme Toggle - top right */}
      <div className="absolute top-4 end-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher variant="globe" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
        {t('auth:welcomeBack')}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        {t('auth:enterCredentials')}
      </p>

      <div className="mb-4 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-300">
        <p className="font-medium">Backend Auth Status</p>
        {backendStatus === 'idle' && <p>Ready to send login request.</p>}
        {backendStatus === 'requesting' && <p>Sending login request to backend...</p>}
        {backendStatus === 'ok' && <p>Login successful. Redirecting...</p>}
        {backendStatus === 'error' && <p>Backend returned an error. See details below.</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth:email')}
          type="email"
          placeholder={t('auth:emailPlaceholder')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label={t('auth:password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth:passwordPlaceholder')}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            <input type="checkbox" className="rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800" />
            <span className="text-neutral-600 dark:text-neutral-400">{t('auth:rememberMe')}</span>
          </label>
          <Link to="/forgot-password" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            {t('auth:forgotPassword')}
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
          {t('auth:signIn')}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
        {t('auth:noAccount')}{' '}
        <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
          {t('auth:signUp')}
        </Link>
      </p>

      {/* Development helper */}
      <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">🧪 {t('auth:testAccounts')}:</p>
        <div className="space-y-1 text-neutral-600 dark:text-neutral-400">
          <p>{t('auth:student')}: student@learnlab.com / Student123!</p>
          <p>{t('auth:admin')}: admin@learnlab.com / Admin123!</p>
        </div>
      </div>
    </div>
  )
}

=======
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 2;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Account lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check if currently locked out
  const isLockedOut = useCallback(() => {
    if (!lockoutUntil) return false;
    if (Date.now() >= lockoutUntil) {
      // Lockout expired, reset
      setLockoutUntil(null);
      setFailedAttempts(0);
      setLockoutRemaining(0);
      setError("");
      return false;
    }
    return true;
  }, [lockoutUntil]);

  // Start lockout countdown
  const startLockout = useCallback(() => {
    const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
    setLockoutUntil(until);

    const tick = () => {
      const remaining = Math.max(0, until - Date.now());
      const mins = Math.ceil(remaining / 60000);
      setLockoutRemaining(mins);
      if (remaining > 0) {
        setTimeout(tick, 1000);
      } else {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setLockoutRemaining(0);
        setError("");
      }
    };
    tick();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // UC-02 alternate 4b: Check lockout
    if (isLockedOut()) return;

    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In production, credentials are validated by the backend API.
    // The demo accepts any non-empty password for known mock accounts.
    const isValidDemo = email.length > 0 && password.length > 0;
    if (isValidDemo) {
      // Success — reset attempts and navigate
      setFailedAttempts(0);
      // In production, we would call the backend API here
      // For now, we'll simulate a successful login
      const user: User = {
        id: "demo",
        email: email,
        firstName: "Demo",
        lastName: "User",
        role: email.includes("admin") ? "admin" : ("student" as UserRole),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      login(user);
      const routes: Record<UserRole, string> = {
        student: "/student",
        admin: "/admin",
      };
      navigate(routes[user.role]);
    } else {
      // UC-02 alternate 4a: Invalid credentials
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        // UC-02 alternate 4b: Lock the account
        startLockout();
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(
          t("auth:invalidCredentials") +
            (remaining <= 3
              ? ` — ${t("auth:failedAttempts", { remaining })}`
              : ""),
        );
      }
    }

    setIsLoading(false);
  };

  const locked = isLockedOut();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="relative max-w-md w-full space-y-6 p-6 bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-700 backdrop-blur-sm">
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-xl opacity-60"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary-100 dark:bg-secondary-900/20 rounded-full blur-xl opacity-40"></div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-display tracking-tight">
              {t("auth:welcomeBack")}
            </h2>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-center">
            {t("auth:enterCredentials")}
          </p>
        </div>

        {/* Account Locked Banner */}
        {locked && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  {t("auth:accountLockedTitle")}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {t("auth:accountLocked", { minutes: lockoutRemaining })}
                </p>
              </div>
            </div>
          </div>
        )}

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
            disabled={locked}
            required
            className="glass"
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
            disabled={locked}
            required
            className="glass"
          />

          {error && !locked && (
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

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={locked}
            className="h-12 text-base rounded-2xl shadow-xl shadow-primary-500/20 hover:scale-[1.01] transition-transform active:scale-95 btn-primary"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("auth:signIn")}
              </div>
            ) : (
              t("auth:signIn")
            )}
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
            <p>{t("auth:student")}: student@learnlab.com</p>
            <p>{t("auth:admin")}: admin@learnlab.com</p>
            <p className="text-neutral-500 dark:text-neutral-500">
              {t("auth:anyPassword")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> backend-updates
