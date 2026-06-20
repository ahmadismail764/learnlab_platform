import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Badge, Input } from '@/components/ui'
import { PageIntro } from '@/components/common'
import { useTheme, useToast } from '@/contexts'
import { authService, type UserPreferences } from '@/services/auth'
import { changeLanguage, type SupportedLanguage } from '@/i18n'

/**
 * SettingsPage - Admin System Settings
 * 
 * Features:
 * - General settings (site name, language)
 * - Notification settings
 * - Security settings
 * - Data management
 * - Theme customization
 */

interface SettingSection {
  id: string
  icon: React.ElementType
  titleKey: string
}

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

const defaultSettings = {
  siteName: 'Learn Lab',
  defaultLanguage: 'ar',
  timezone: 'Africa/Cairo',
  emailNotifications: true,
  practiceReminders: true,
  weeklyDigest: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  requireStrongPassword: true,
  twoFactorEnabled: false,
  questionsPerSession: 10,
  showHints: true,
  allowSkip: true,
  timerEnabled: false,
  primaryColor: '#58cc02',
  accentColor: '#ff9600',
  darkModeEnabled: false,
}

type SettingsState = typeof defaultSettings

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function coerceNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function coerceBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function coerceLanguage(value: unknown, fallback: string) {
  return value === 'ar' || value === 'en' ? value : fallback
}

function normalizeSettings(preferences: UserPreferences): SettingsState {
  const storedSettings = isRecord(preferences.adminSettings)
    ? preferences.adminSettings
    : preferences

  return {
    siteName: coerceString(storedSettings.siteName, defaultSettings.siteName),
    defaultLanguage: coerceLanguage(
      storedSettings.defaultLanguage ?? preferences.language,
      defaultSettings.defaultLanguage,
    ),
    timezone: coerceString(storedSettings.timezone, defaultSettings.timezone),
    emailNotifications: coerceBoolean(storedSettings.emailNotifications, defaultSettings.emailNotifications),
    practiceReminders: coerceBoolean(storedSettings.practiceReminders, defaultSettings.practiceReminders),
    weeklyDigest: coerceBoolean(storedSettings.weeklyDigest, defaultSettings.weeklyDigest),
    sessionTimeout: coerceNumber(storedSettings.sessionTimeout, defaultSettings.sessionTimeout),
    maxLoginAttempts: coerceNumber(storedSettings.maxLoginAttempts, defaultSettings.maxLoginAttempts),
    requireStrongPassword: coerceBoolean(storedSettings.requireStrongPassword, defaultSettings.requireStrongPassword),
    twoFactorEnabled: coerceBoolean(storedSettings.twoFactorEnabled, defaultSettings.twoFactorEnabled),
    questionsPerSession: coerceNumber(storedSettings.questionsPerSession, defaultSettings.questionsPerSession),
    showHints: coerceBoolean(storedSettings.showHints, defaultSettings.showHints),
    allowSkip: coerceBoolean(storedSettings.allowSkip, defaultSettings.allowSkip),
    timerEnabled: coerceBoolean(storedSettings.timerEnabled, defaultSettings.timerEnabled),
    primaryColor: coerceString(storedSettings.primaryColor, defaultSettings.primaryColor),
    accentColor: coerceString(storedSettings.accentColor, defaultSettings.accentColor),
    darkModeEnabled: coerceBoolean(
      storedSettings.darkModeEnabled ?? (preferences.theme === 'dark'),
      defaultSettings.darkModeEnabled,
    ),
  }
}

function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${checked ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full 
          bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}

export function SettingsPage() {
  const { t } = useTranslation(['admin', 'common'])
  const { setTheme } = useTheme()
  const { showSuccess, showError } = useToast()
  
  const [activeSection, setActiveSection] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [lastSavedSettings, setLastSavedSettings] = useState<SettingsState>(defaultSettings)

  const sections: SettingSection[] = [
    { id: 'general', icon: Settings, titleKey: 'admin:generalSettings' },
    { id: 'notifications', icon: Bell, titleKey: 'admin:notificationSettings' },
    { id: 'security', icon: Shield, titleKey: 'admin:securitySettings' },
    { id: 'practice', icon: Database, titleKey: 'admin:practiceSettings' },
    { id: 'theme', icon: Palette, titleKey: 'admin:themeSettings' },
  ]

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      setIsLoadingSettings(true)
      setSettingsError('')

      try {
        const preferences = await authService.getPreferences()
        const nextSettings = normalizeSettings(preferences)

        if (!isMounted) return

        setSettings(nextSettings)
        setLastSavedSettings(nextSettings)
        setHasChanges(false)
        setTheme(nextSettings.darkModeEnabled ? 'dark' : 'light')
        await changeLanguage(nextSettings.defaultLanguage as SupportedLanguage)
      } catch (error) {
        if (!isMounted) return
        const message = error instanceof Error ? error.message : 'Failed to load settings'
        setSettingsError(message)
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false)
        }
      }
    }

    void loadSettings()

    return () => {
      isMounted = false
    }
  }, [setTheme])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    if (isLoadingSettings || isSavingSettings) return
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSavingSettings(true)
    setSettingsError('')

    try {
      const preferences = await authService.updatePreferences({
        adminSettings: settings,
        language: settings.defaultLanguage,
        theme: settings.darkModeEnabled ? 'dark' : 'light',
        notifications: {
          email: settings.emailNotifications,
          practiceReminders: settings.practiceReminders,
          weeklyDigest: settings.weeklyDigest,
        },
      })
      const nextSettings = normalizeSettings(preferences)

      setSettings(nextSettings)
      setLastSavedSettings(nextSettings)
      setHasChanges(false)
      setSaved(true)
      setTheme(nextSettings.darkModeEnabled ? 'dark' : 'light')
      await changeLanguage(nextSettings.defaultLanguage as SupportedLanguage)
      showSuccess(t('admin:settingsSaved'))
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('admin:settingsSaveFailed')
      setSettingsError(message)
      showError(message)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleReset = () => {
    setSettings(lastSavedSettings)
    setHasChanges(false)
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin settings"
        title={t('admin:systemSettings')}
        description={t('admin:settingsDescription')}
        icon={<Settings className="h-6 w-6" />}
        tone="secondary"
        actions={
          <>
            {hasChanges && (
              <Button
                variant="outline"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                disabled={isLoadingSettings || isSavingSettings}
                onClick={handleReset}
              >
                {t('common:reset')}
              </Button>
            )}
            <Button
              leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              disabled={!hasChanges || isLoadingSettings}
              isLoading={isSavingSettings}
              onClick={handleSave}
            >
              {saved ? t('common:saved') : t('common:saveChanges')}
            </Button>
          </>
        }
      />

      {settingsError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
          {settingsError}
        </div>
      )}

      {isLoadingSettings && (
        <Card className="dashboard-panel-soft border-0" padding="sm">
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            {t('admin:loadingSettings')}
          </div>
        </Card>
      )}

      {/* Status Badge */}
      {hasChanges && (
        <Card className="dashboard-panel-soft border-0" padding="sm">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Badge variant="warning" dot />
            {t('admin:unsavedChanges')}
          </div>
        </Card>
      )}

      <Card className="dashboard-panel overflow-hidden" padding="none">
        <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Sidebar Navigation */}
          <aside className="border-b border-neutral-200/80 p-1.5 dark:border-neutral-800 lg:border-b-0 lg:border-e">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-start text-sm transition-colors
                      ${isActive
                        ? 'bg-white text-secondary-700 shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:text-secondary-300 dark:ring-neutral-700'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-900/60'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-secondary-600 dark:text-secondary-300' : 'text-neutral-400 dark:text-neutral-500'}`} />
                    <span className="truncate whitespace-nowrap font-medium">{t(section.titleKey)}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

        {/* Settings Content */}
          <div className="min-w-0 p-4 sm:p-6">
          {/* General Settings */}
          {activeSection === 'general' && (
            <section>
              <CardHeader 
                title={t('admin:generalSettings')}
                subtitle={t('admin:generalSettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:siteName')}
                    </label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => updateSetting('siteName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:defaultLanguage')}
                    </label>
                    <select
                      value={settings.defaultLanguage}
                      onChange={(e) => updateSetting('defaultLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="ar">العربية (Arabic)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:timezone')}
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                      <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </section>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <section>
              <CardHeader 
                title={t('admin:notificationSettings')}
                subtitle={t('admin:notificationSettingsDescription')}
              />
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:emailNotifications')}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:emailNotificationsDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.emailNotifications}
                    onChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:practiceReminders')}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:practiceRemindersDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.practiceReminders}
                    onChange={(checked) => updateSetting('practiceReminders', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:weeklyDigest')}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:weeklyDigestDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.weeklyDigest}
                    onChange={(checked) => updateSetting('weeklyDigest', checked)}
                  />
                </div>
              </CardContent>
            </section>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <section>
              <CardHeader 
                title={t('admin:securitySettings')}
                subtitle={t('admin:securitySettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:sessionTimeout')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-neutral-500 dark:text-neutral-400">{t('common:minutes')}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:maxLoginAttempts')}
                    </label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting('maxLoginAttempts', Number(e.target.value))}
                      className="w-24"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:requireStrongPassword')}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:requireStrongPasswordDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.requireStrongPassword}
                      onChange={(checked) => updateSetting('requireStrongPassword', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:twoFactorAuth')}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:twoFactorAuthDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.twoFactorEnabled}
                      onChange={(checked) => updateSetting('twoFactorEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </section>
          )}

          {/* Practice Settings */}
          {activeSection === 'practice' && (
            <section>
              <CardHeader 
                title={t('admin:practiceSettings')}
                subtitle={t('admin:practiceSettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t('admin:questionsPerSession')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.questionsPerSession}
                      onChange={(e) => updateSetting('questionsPerSession', Number(e.target.value))}
                      className="w-24"
                      min={5}
                      max={50}
                    />
                    <span className="text-neutral-500 dark:text-neutral-400">{t('admin:questions')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:showHints')}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:showHintsDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.showHints}
                      onChange={(checked) => updateSetting('showHints', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:allowSkip')}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:allowSkipDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.allowSkip}
                      onChange={(checked) => updateSetting('allowSkip', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:timerEnabled')}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:timerEnabledDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.timerEnabled}
                      onChange={(checked) => updateSetting('timerEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </section>
          )}

          {/* Theme Settings */}
          {activeSection === 'theme' && (
            <section>
              <CardHeader 
                title={t('admin:themeSettings')}
                subtitle={t('admin:themeSettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:primaryColor')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('admin:accentColor')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-neutral-100 dark:border-neutral-700">
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-100">{t('admin:darkMode')}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:darkModeDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.darkModeEnabled}
                    onChange={(checked) => updateSetting('darkModeEnabled', checked)}
                  />
                </div>

                {/* Theme Preview */}
                <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{t('admin:preview')}</p>
                  <div className="flex gap-3">
                    <Button style={{ backgroundColor: settings.primaryColor }}>
                      {t('common:primary')}
                    </Button>
                    <Button variant="outline" style={{ borderColor: settings.accentColor, color: settings.accentColor }}>
                      {t('common:accent')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </section>
          )}
          </div>
        </div>
      </Card>
    </div>
  )
}
