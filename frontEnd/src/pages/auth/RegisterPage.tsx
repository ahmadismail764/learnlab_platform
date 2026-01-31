import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui'

/**
 * RegisterPage
 * 
 * New user registration.
 * For now, shows UI only - will connect to API later.
 */

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorKey, setErrorKey] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorKey('')

    if (formData.password !== formData.confirmPassword) {
      setErrorKey('auth:passwordsDoNotMatch')
      return
    }

    if (formData.password.length < 8) {
      setErrorKey('auth:passwordTooShort')
      return
    }

    setIsLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For now, just redirect to login
    // In real app, would create account via API
    navigate('/login')
    
    setIsLoading(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-2">
        {t('auth:createAccount')}
      </h2>
      <p className="text-neutral-600 mb-8">
        {t('auth:startLearning')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('auth:firstName')}
            name="firstName"
            placeholder={t('auth:firstNamePlaceholder')}
            value={formData.firstName}
            onChange={handleChange}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label={t('auth:lastName')}
            name="lastName"
            placeholder={t('auth:lastNamePlaceholder')}
            value={formData.lastName}
            onChange={handleChange}
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
          required
        />

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
              className="text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />

        <Input
          label={t('auth:confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder={t('auth:confirmPasswordPlaceholder')}
          value={formData.confirmPassword}
          onChange={handleChange}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        {errorKey && (
          <p className="text-sm text-error bg-red-50 px-3 py-2 rounded-lg">
            {t(errorKey)}
          </p>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input 
            type="checkbox" 
            className="rounded border-neutral-300 mt-1" 
            required 
          />
          <span className="text-neutral-600">
            {t('auth:agreeToTerms')}{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">{t('auth:termsOfService')}</a>
            {' '}{t('auth:and')}{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">{t('auth:privacyPolicy')}</a>
          </span>
        </label>

        <Button type="submit" fullWidth isLoading={isLoading}>
          {t('auth:createAccount')}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 mt-6">
        {t('auth:haveAccount')}{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          {t('auth:signIn')}
        </Link>
      </p>
    </div>
  )
}
