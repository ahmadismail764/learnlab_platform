import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit3,
  Lock,
  Trash2,
  Users,
  FileQuestion,
  Activity,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Avatar, Badge, Input } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * AdminProfilePage
 *
 * Profile page for admins showing:
 * - Personal info with avatar
 * - System overview stats
 * - Recent admin actions
 * - Quick access admin tools
 * - Account settings (password, danger zone)
 */

export function AdminProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'auth', 'admin'])
  const user = useCurrentUser()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Mock system stats
  const systemStats = {
    totalStudents: 245,
    totalQuestions: 1280,
    activeToday: 42,
    systemUptime: '99.9%',
  }

  // Mock recent admin actions
  const recentActions = [
    { type: 'question' as const, descKey: 'profile:addedQuestion', detail: 'Propositional Logic - Tier 2', time: '1h ago' },
    { type: 'settings' as const, descKey: 'profile:updatedSettings', detail: 'Notification preferences', time: '3h ago' },
    { type: 'review' as const, descKey: 'profile:reviewedContent', detail: '5 questions approved', time: '1d ago' },
    { type: 'export' as const, descKey: 'profile:exportedData', detail: 'Student analytics CSV', time: '2d ago' },
  ]

  function getActionIcon(type: string) {
    switch (type) {
      case 'question': return <FileQuestion className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      case 'settings': return <Settings className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
      case 'review': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'export': return <BarChart3 className="w-4 h-4 text-accent-600 dark:text-accent-400" />
      default: return <Activity className="w-4 h-4 text-neutral-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
        {t('profile:myProfile')}
      </h1>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            src={user.avatarUrl}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                {user.firstName} {user.lastName}
              </h2>
              <Badge variant="secondary" size="sm">
                {t('auth:admin')}
              </Badge>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">{user.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t('profile:memberSince')} {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="w-4 h-4" />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {t('profile:editProfile')}
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Personal Info */}
          {isEditing && (
            <Card>
              <CardHeader title={t('profile:personalInfo')} subtitle={t('profile:personalInfoDescription')} />
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t('profile:firstName')}
                    defaultValue={user.firstName}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label={t('profile:lastName')}
                    defaultValue={user.lastName}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={t('profile:email')}
                      defaultValue={user.email}
                      leftIcon={<Mail className="w-4 h-4" />}
                      type="email"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    {t('common:cancel')}
                  </Button>
                  <Button variant="primary" onClick={() => setIsEditing(false)}>
                    {t('common:saveChanges')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Overview */}
          <Card>
            <CardHeader
              title={t('profile:systemOverview')}
              subtitle={t('profile:systemOverviewDescription')}
            />
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <div className="p-2 bg-primary-100 dark:bg-primary-800/30 rounded-lg w-fit mx-auto mb-2">
                    <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{systemStats.totalStudents}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:totalStudents')}</p>
                </div>
                <div className="text-center p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl">
                  <div className="p-2 bg-secondary-100 dark:bg-secondary-800/30 rounded-lg w-fit mx-auto mb-2">
                    <FileQuestion className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{systemStats.totalQuestions}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:totalQuestions')}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg w-fit mx-auto mb-2">
                    <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{systemStats.activeToday}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:activeToday')}</p>
                </div>
                <div className="text-center p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                  <div className="p-2 bg-accent-100 dark:bg-accent-800/30 rounded-lg w-fit mx-auto mb-2">
                    <Clock className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{systemStats.systemUptime}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:systemUptime')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Admin Actions */}
          <Card>
            <CardHeader
              title={t('profile:recentAdminActions')}
              subtitle={t('profile:recentAdminActionsDescription')}
            />
            <CardContent>
              <div className="space-y-2">
                {recentActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      action.type === 'question' ? 'bg-primary-100 dark:bg-primary-900/30' :
                      action.type === 'settings' ? 'bg-secondary-100 dark:bg-secondary-900/30' :
                      action.type === 'review' ? 'bg-green-100 dark:bg-green-900/30' :
                      'bg-accent-100 dark:bg-accent-900/30'
                    }`}>
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                        {t(action.descKey)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {action.detail}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                      {action.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Admin Tools */}
          <Card>
            <CardHeader
              title={t('profile:adminTools')}
              subtitle={t('profile:adminToolsDescription')}
            />
            <CardContent className="space-y-3 py-2">
              <Link to="/admin/questions">
                <Button variant="outline" fullWidth leftIcon={<FileQuestion className="w-4 h-4" />}>
                  {t('profile:manageQuestions')}
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button variant="outline" fullWidth leftIcon={<BarChart3 className="w-4 h-4" />}>
                  {t('profile:viewAnalytics')}
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" fullWidth leftIcon={<Settings className="w-4 h-4" />}>
                  {t('profile:systemSettings')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader
              title={t('profile:changePassword')}
              action={
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  {showPasswordForm ? t('common:cancel') : t('common:edit')}
                </button>
              }
            />
            {showPasswordForm ? (
              <CardContent>
                <div className="space-y-3">
                  <Input
                    label={t('profile:currentPassword')}
                    type="password"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <Input
                    label={t('profile:newPassword')}
                    type="password"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <Input
                    label={t('profile:confirmNewPassword')}
                    type="password"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <Button variant="primary" fullWidth>
                    {t('profile:updatePassword')}
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
                  <Shield className="w-5 h-5" />
                  <p className="text-sm">••••••••••</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader title={t('profile:dangerZone')} />
            <CardContent>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                {t('profile:deleteAccountWarning')}
              </p>
              <Button variant="danger" fullWidth leftIcon={<Trash2 className="w-4 h-4" />}>
                {t('profile:deleteAccount')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
