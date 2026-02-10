import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts'
import type { User, UserRole } from '@/types'

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

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 2

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Account lockout state
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  /**
   * Mock users for development — Egyptian Arabic names.
   * In production, authentication is handled entirely by the backend API.
   * The demo accepts any non-empty password for the accounts below.
   */
  const mockUsers: Record<string, User> = {
    'student@learnlab.com': {
      id: '1',
      email: 'student@learnlab.com',
      firstName: 'أحمد',
      lastName: 'محمد',
      role: 'student' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    'admin@learnlab.com': {
      id: '2',
      email: 'admin@learnlab.com',
      firstName: 'سارة',
      lastName: 'إبراهيم',
      role: 'admin' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }

  // Check if currently locked out
  const isLockedOut = useCallback(() => {
    if (!lockoutUntil) return false
    if (Date.now() >= lockoutUntil) {
      // Lockout expired, reset
      setLockoutUntil(null)
      setFailedAttempts(0)
      setLockoutRemaining(0)
      setError('')
      return false
    }
    return true
  }, [lockoutUntil])

  // Start lockout countdown
  const startLockout = useCallback(() => {
    const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000
    setLockoutUntil(until)

    const tick = () => {
      const remaining = Math.max(0, until - Date.now())
      const mins = Math.ceil(remaining / 60000)
      setLockoutRemaining(mins)
      if (remaining > 0) {
        setTimeout(tick, 1000)
      } else {
        setLockoutUntil(null)
        setFailedAttempts(0)
        setLockoutRemaining(0)
        setError('')
      }
    }
    tick()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // UC-02 alternate 4b: Check lockout
    if (isLockedOut()) return

    setIsLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = mockUsers[email.toLowerCase()]

    // Demo: accept any non-empty password for known mock accounts.
    // In production, credentials are validated by the backend API.
    const isValidDemo = user && password.length > 0
    if (isValidDemo) {
      // Success — reset attempts and navigate
      setFailedAttempts(0)
      login(user)
      const routes: Record<UserRole, string> = {
        student: '/student',
        admin: '/admin',
      }
      navigate(routes[user.role])
    } else {
      // UC-02 alternate 4a: Invalid credentials
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        // UC-02 alternate 4b: Lock the account
        startLockout()
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts
        setError(
          t('auth:invalidCredentials') +
          (remaining <= 3 ? ` — ${t('auth:failedAttempts', { remaining })}` : '')
        )
      }
    }
    
    setIsLoading(false)
  }

  const locked = isLockedOut()

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

      {/* Account Locked Banner */}
      {locked && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                {t('auth:accountLockedTitle')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {t('auth:accountLocked', { minutes: lockoutRemaining })}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth:email')}
          type="email"
          placeholder={t('auth:emailPlaceholder')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={locked}
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
          disabled={locked}
          required
        />

        {error && !locked && (
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

        <Button type="submit" fullWidth isLoading={isLoading} disabled={locked}>
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
          <p>{t('auth:student')}: student@learnlab.com</p>
          <p>{t('auth:admin')}: admin@learnlab.com</p>
          <p className="text-neutral-500 dark:text-neutral-500">{t('auth:anyPassword')}</p>
        </div>
      </div>
    </div>
  )
}
