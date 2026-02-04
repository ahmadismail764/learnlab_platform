import { useState } from 'react'
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

export function SettingsPage() {
  const { t } = useTranslation(['admin', 'common'])
  
  const [activeSection, setActiveSection] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [saved, setSaved] = useState(false)

  // Mock settings state
  const [settings, setSettings] = useState({
    // General
    siteName: 'Learn Lab',
    defaultLanguage: 'ar',
    timezone: 'Asia/Riyadh',
    
    // Notifications
    emailNotifications: true,
    practiceReminders: true,
    achievementAlerts: true,
    weeklyDigest: false,
    
    // Security
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    twoFactorEnabled: false,
    
    // Practice
    questionsPerSession: 10,
    showHints: true,
    allowSkip: true,
    timerEnabled: false,
    
    // Theme
    primaryColor: '#58cc02',
    accentColor: '#ff9600',
    darkModeEnabled: false,
  })

  const sections: SettingSection[] = [
    { id: 'general', icon: Settings, titleKey: 'admin:generalSettings' },
    { id: 'notifications', icon: Bell, titleKey: 'admin:notificationSettings' },
    { id: 'security', icon: Shield, titleKey: 'admin:securitySettings' },
    { id: 'practice', icon: Database, titleKey: 'admin:practiceSettings' },
    { id: 'theme', icon: Palette, titleKey: 'admin:themeSettings' },
  ]

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = () => {
    // Mock save - in real app, would call API
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    // Mock reset - in real app, would fetch from API
    setHasChanges(false)
  }

  const ToggleSwitch = ({ 
    checked, 
    onChange,
    disabled = false 
  }: { 
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
  }) => (
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
        ${checked ? 'bg-primary-500' : 'bg-neutral-200'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">
            {t('admin:systemSettings')}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('admin:settingsDescription')}
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <Button variant="outline" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleReset}>
              {t('common:reset')}
            </Button>
          )}
          <Button 
            leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            {saved ? t('common:saved') : t('common:saveChanges')}
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      {hasChanges && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          <Badge variant="warning" dot />
          {t('admin:unsavedChanges')}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors
                        ${isActive 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-neutral-600 hover:bg-neutral-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{t(section.titleKey)}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeSection === 'general' && (
            <Card>
              <CardHeader 
                title={t('admin:generalSettings')}
                subtitle={t('admin:generalSettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('admin:siteName')}
                    </label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => updateSetting('siteName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('admin:defaultLanguage')}
                    </label>
                    <select
                      value={settings.defaultLanguage}
                      onChange={(e) => updateSetting('defaultLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="ar">العربية (Arabic)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('admin:timezone')}
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                      <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader 
                title={t('admin:notificationSettings')}
                subtitle={t('admin:notificationSettingsDescription')}
              />
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <p className="font-medium text-neutral-800">{t('admin:emailNotifications')}</p>
                    <p className="text-sm text-neutral-500">{t('admin:emailNotificationsDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.emailNotifications}
                    onChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <p className="font-medium text-neutral-800">{t('admin:practiceReminders')}</p>
                    <p className="text-sm text-neutral-500">{t('admin:practiceRemindersDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.practiceReminders}
                    onChange={(checked) => updateSetting('practiceReminders', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <p className="font-medium text-neutral-800">{t('admin:achievementAlerts')}</p>
                    <p className="text-sm text-neutral-500">{t('admin:achievementAlertsDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.achievementAlerts}
                    onChange={(checked) => updateSetting('achievementAlerts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-neutral-800">{t('admin:weeklyDigest')}</p>
                    <p className="text-sm text-neutral-500">{t('admin:weeklyDigestDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.weeklyDigest}
                    onChange={(checked) => updateSetting('weeklyDigest', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <Card>
              <CardHeader 
                title={t('admin:securitySettings')}
                subtitle={t('admin:securitySettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('admin:sessionTimeout')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-neutral-500">{t('common:minutes')}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div>
                      <p className="font-medium text-neutral-800">{t('admin:requireStrongPassword')}</p>
                      <p className="text-sm text-neutral-500">{t('admin:requireStrongPasswordDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.requireStrongPassword}
                      onChange={(checked) => updateSetting('requireStrongPassword', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-neutral-800">{t('admin:twoFactorAuth')}</p>
                      <p className="text-sm text-neutral-500">{t('admin:twoFactorAuthDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.twoFactorEnabled}
                      onChange={(checked) => updateSetting('twoFactorEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practice Settings */}
          {activeSection === 'practice' && (
            <Card>
              <CardHeader 
                title={t('admin:practiceSettings')}
                subtitle={t('admin:practiceSettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                    <span className="text-neutral-500">{t('admin:questions')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div>
                      <p className="font-medium text-neutral-800">{t('admin:showHints')}</p>
                      <p className="text-sm text-neutral-500">{t('admin:showHintsDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.showHints}
                      onChange={(checked) => updateSetting('showHints', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div>
                      <p className="font-medium text-neutral-800">{t('admin:allowSkip')}</p>
                      <p className="text-sm text-neutral-500">{t('admin:allowSkipDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.allowSkip}
                      onChange={(checked) => updateSetting('allowSkip', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-neutral-800">{t('admin:timerEnabled')}</p>
                      <p className="text-sm text-neutral-500">{t('admin:timerEnabledDescription')}</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.timerEnabled}
                      onChange={(checked) => updateSetting('timerEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Settings */}
          {activeSection === 'theme' && (
            <Card>
              <CardHeader 
                title={t('admin:themeSettings')}
                subtitle={t('admin:themeSettingsDescription')}
              />
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('admin:primaryColor')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-neutral-300 cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('admin:accentColor')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-neutral-300 cursor-pointer"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-neutral-100">
                  <div>
                    <p className="font-medium text-neutral-800">{t('admin:darkMode')}</p>
                    <p className="text-sm text-neutral-500">{t('admin:darkModeDescription')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.darkModeEnabled}
                    onChange={(checked) => updateSetting('darkModeEnabled', checked)}
                  />
                </div>

                {/* Theme Preview */}
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm font-medium text-neutral-700 mb-3">{t('admin:preview')}</p>
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
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
