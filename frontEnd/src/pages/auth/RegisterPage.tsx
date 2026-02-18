import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts'
import type { UserRole } from '@/types'

/**
 * RegisterPage — UC-01
 *
 * Flow:
 * 1. Student opens LearnLab → system shows registration form
 * 2. Student enters unique email and password
 * 3. System validates inputs (client-side: email format, password strength, match)
 * 4. System creates account, authenticates, and redirects to student dashboard
 *
 * Alternate Flows:
 * 4a. Invalid input → field-level errors (weak password, required fields)
 * 4b. Email exists → "Email already registered. Log in" message
 */

// Mock "existing" emails for demo
const existingEmails = ['student@learnlab.com', 'admin@learnlab.com']

type PasswordStrength = 'weak' | 'medium' | 'strong'

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak'
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
  if (password.length >= 12 && score >= 3) return 'strong'
  if (password.length >= 8 && score >= 2) return 'medium'
  return 'weak'
}

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState(false)

  // Live password strength
  const passwordStrength = useMemo<PasswordStrength | null>(
    () => (formData.password ? getPasswordStrength(formData.password) : null),
    [formData.password]
  )

  const strengthConfig: Record<PasswordStrength, { color: string; barColor: string; width: string; label: string }> = {
    weak: {
      color: 'text-red-600 dark:text-red-400',
      barColor: 'bg-red-500',
      width: 'w-1/3',
      label: t('auth:passwordStrengthWeak'),
    },
    medium: {
      color: 'text-amber-600 dark:text-amber-400',
      barColor: 'bg-amber-500',
      width: 'w-2/3',
      label: t('auth:passwordStrengthMedium'),
    },
    strong: {
      color: 'text-green-600 dark:text-green-400',
      barColor: 'bg-green-500',
      width: 'w-full',
      label: t('auth:passwordStrengthStrong'),
    },
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }))
    }
    if (generalError) setGeneralError('')
  }

  // Client-side validation
  const validate = (): boolean => {
    const errors: FieldErrors = {}

    if (!formData.firstName.trim()) errors.firstName = t('auth:fieldRequired')
    if (!formData.lastName.trim()) errors.lastName = t('auth:fieldRequired')

    if (!formData.email.trim()) {
      errors.email = t('auth:fieldRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('auth:invalidEmail')
    } else if (existingEmails.includes(formData.email.toLowerCase())) {
      // UC-01 alternate 4b: Email already registered
      errors.email = t('auth:emailAlreadyRegistered')
    }

    if (!formData.password) {
      errors.password = t('auth:fieldRequired')
    } else if (formData.password.length < 8) {
      // UC-01 alternate 4a: weak password
      errors.password = t('auth:passwordTooShort')
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t('auth:fieldRequired')
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth:passwordsDoNotMatch')
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    if (!validate()) return

    setIsLoading(true)

    try {
      // UC-01 step 5-6: Create account, authenticate, redirect to student dashboard
      // register() in AuthContext also handles auto-login
      await register({
        username: formData.email,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      })

      setSuccess(true)

      // Brief success message before redirect
      setTimeout(() => {
        navigate('/student')
      }, 1200)
    } catch (err: any) {
      setGeneralError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state briefly before redirect
  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
          {t('auth:registrationSuccess')}
        </h2>
      </div>
    )
  }

  return (
    <div>
      {/* Language Switcher & Theme Toggle - top right */}
      <div className="absolute top-4 end-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher variant="globe" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
        {t('auth:createAccount')}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        {t('auth:startLearning')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('auth:firstName')}
            name="firstName"
            placeholder={t('auth:firstNamePlaceholder')}
            value={formData.firstName}
            onChange={handleChange}
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.firstName}
            required
          />
          <Input
            label={t('auth:lastName')}
            name="lastName"
            placeholder={t('auth:lastNamePlaceholder')}
            value={formData.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
            required
          />
        </div>

        <Input
          label={t('auth:email')}
          type="email"
          name="email"
          placeholder={t('auth:emailPlaceholder')}
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="w-4 h-4" />}
          error={fieldErrors.email}
          required
        />

        <div>
          <Input
            label={t('auth:password')}
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder={t('auth:passwordMinLength')}
            value={formData.password}
            onChange={handleChange}
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
            error={fieldErrors.password}
            required
          />

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('auth:passwordStrength')}
                </span>
                <span className={`text-xs font-medium ${strengthConfig[passwordStrength].color}`}>
                  {strengthConfig[passwordStrength].label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthConfig[passwordStrength].barColor} ${strengthConfig[passwordStrength].width}`}
                />
              </div>
            </div>
          )}
        </div>

        <Input
          label={t('auth:confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder={t('auth:confirmPasswordPlaceholder')}
          value={formData.confirmPassword}
          onChange={handleChange}
          leftIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.confirmPassword}
          required
        />

        {generalError && (
          <p className="text-sm text-error bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
            {generalError}
          </p>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 mt-1"
            required
          />
          <span className="text-neutral-600 dark:text-neutral-400">
            {t('auth:agreeToTerms')}{' '}
            <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">{t('auth:termsOfService')}</a>
            {' '}{t('auth:and')}{' '}
            <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">{t('auth:privacyPolicy')}</a>
          </span>
        </label>

        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading ? t('auth:creatingAccount') : t('auth:createAccount')}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
        {t('auth:haveAccount')}{' '}
        <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
          {t('auth:signIn')}
        </Link>
      </p>
    </div>
  )
}
