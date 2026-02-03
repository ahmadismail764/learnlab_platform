import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/contexts'
import type { User, UserRole } from '@/types'

/**
 * LoginPage
 * 
 * Handles user authentication.
 * For now, uses mock login - will connect to API later.
 * RTL-aware with language switcher.
 */

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Mock users for development - Egyptian Arabic names
  const mockUsers: Record<string, User> = {
    'student@learnlab.com': {
      id: '1',
      email: 'student@learnlab.com',
      firstName: 'أحمد',   // Ahmed
      lastName: 'محمد',  // Mohamed
      role: 'student' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    'admin@learnlab.com': {
      id: '2',
      email: 'admin@learnlab.com',
      firstName: 'سارة',   // Sara
      lastName: 'إبراهيم', // Ibrahim
      role: 'admin' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = mockUsers[email.toLowerCase()]
    
    if (user && password === 'password') {
      login(user)
      // Navigate based on role
      const routes: Record<UserRole, string> = {
        student: '/student',
        admin: '/admin',
      }
      navigate(routes[user.role])
    } else {
      setError(t('auth:invalidCredentials'))
    }
    
    setIsLoading(false)
  }

  return (
    <div>
      {/* Language Switcher - top right */}
      <div className="absolute top-4 end-4">
        <LanguageSwitcher variant="buttons" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-800 mb-2">
        {t('auth:welcomeBack')}
      </h2>
      <p className="text-neutral-600 mb-8">
        {t('auth:enterCredentials')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth:email')}
          type="email"
          placeholder={t('auth:emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label={t('auth:password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth:passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />

        {error && (
          <p className="text-sm text-error bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-neutral-300" />
            <span className="text-neutral-600">{t('auth:rememberMe')}</span>
          </label>
          <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700">
            {t('auth:forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          {t('auth:signIn')}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 mt-6">
        {t('auth:noAccount')}{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          {t('auth:signUp')}
        </Link>
      </p>

      {/* Development helper */}
      <div className="mt-8 p-4 bg-neutral-100 rounded-lg text-sm">
        <p className="font-medium text-neutral-700 mb-2">🧪 {t('auth:testAccounts')}:</p>
        <div className="space-y-1 text-neutral-600">
          <p>{t('auth:student')}: student@learnlab.com</p>
          <p>{t('auth:admin')}: admin@learnlab.com</p>
          <p className="text-neutral-500">Password: password</p>
        </div>
      </div>
    </div>
  )
}
