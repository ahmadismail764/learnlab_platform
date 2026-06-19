import { useEffect, useState } from 'react'
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
  ScrollText,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Avatar, Badge, Input } from '@/components/ui'
import { PageIntro, PageStatCard } from '@/components/common'
import { useAuth, useCurrentUser, useToast } from '@/contexts'
import { analyticsService, authService, learnersService } from '@/services'
import { useAuditLogs } from '@/hooks'

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

function formatActionType(actionType: string) {
  return actionType
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}

export function AdminProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'auth', 'admin'])
  const user = useCurrentUser()
  const { updateUser } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  })

  const [systemStats, setSystemStats] = useState({
    totalLearners: 0,
    totalQuestions: 0,
    activeToday: 0,
  })
  const [statsError, setStatsError] = useState('')
  const {
    data: auditLogs = [],
    isLoading: auditLogsLoading,
    error: auditLogsError,
  } = useAuditLogs()

  useEffect(() => {
    setProfileForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })
  }, [user.firstName, user.lastName, user.email])

  useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      const nextStats = {
        totalLearners: 0,
        totalQuestions: 0,
        activeToday: 0,
      }
      const errors: string[] = []

      try {
        const leaderboard = await learnersService.getLeaderboard()
        nextStats.totalLearners = leaderboard.length
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Failed to load learner standings')
      }

      try {
        const aggregated = await analyticsService.getAggregatedMetrics()
        nextStats.totalQuestions = aggregated?.review_count ?? 0
        nextStats.activeToday = aggregated?.active_users?.['7_days'] ?? 0
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Failed to load admin metrics')
      }

      if (!isMounted) return

      setSystemStats(nextStats)

      if (errors.length > 0) {
        if (errors.some((message) => message.includes('Insufficient data'))) {
          setStatsError('Insufficient practice data for full analytics (< 10 sessions). Stats show available data.')
        } else {
          setStatsError(errors.join(' '))
        }
      } else {
        setStatsError('')
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    setProfileError('')

    try {
      const updated = await authService.updateCurrentUser({
        first_name: profileForm.firstName.trim(),
        last_name: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
      })

      updateUser({
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        username: updated.username,
        role: updated.role === 'admin' || updated.role === 'learner'
          ? updated.role
          : updated.is_staff
            ? 'admin'
            : 'learner',
      })

      setIsEditing(false)
      showSuccess('Profile updated successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      setProfileError(message)
      showError(message)
    } finally {
      setIsSavingProfile(false)
    }
  }



  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageIntro
        eyebrow="Admin profile"
        title={t('profile:myProfile')}
        description={t('profile:personalInfoDescription')}
        icon={<Shield className="h-6 w-6" />}
        tone="secondary"
        actions={(
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="w-4 h-4" />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {t('profile:editProfile')}
          </Button>
        )}
      />

      {profileError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
          {profileError}
        </div>
      )}

      {statsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          {statsError}
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            src={user.avatarUrl}
            avatarColor={user.avatarColor}
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
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    leftIcon={<User className="w-4 h-4" />}
                    disabled={isSavingProfile}
                  />
                  <Input
                    label={t('profile:lastName')}
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    leftIcon={<User className="w-4 h-4" />}
                    disabled={isSavingProfile}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={t('profile:email')}
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                      leftIcon={<Mail className="w-4 h-4" />}
                      type="email"
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="ghost"
                    disabled={isSavingProfile}
                    onClick={() => {
                      setIsEditing(false)
                      setProfileError('')
                      setProfileForm({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                      })
                    }}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button variant="primary" disabled={isSavingProfile} onClick={handleSaveProfile}>
                    {isSavingProfile ? t('common:loading') : t('common:saveChanges')}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PageStatCard
                  icon={<Users className="h-5 w-5" />}
                  label={t('profile:totalLearners')}
                  value={systemStats.totalLearners}
                  tone="primary"
                />
                <PageStatCard
                  icon={<FileQuestion className="h-5 w-5" />}
                  label={t('profile:totalQuestions')}
                  value={systemStats.totalQuestions}
                  tone="secondary"
                />
                <PageStatCard
                  icon={<Activity className="h-5 w-5" />}
                  label={t('profile:activeToday')}
                  value={systemStats.activeToday}
                  tone="success"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('admin:recentAdminActions')}
              subtitle={t('admin:auditLogsDescription')}
            />
            <CardContent>
              {auditLogsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                  ))}
                </div>
              ) : auditLogsError instanceof Error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {auditLogsError.message}
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('admin:noAuditLogs')}
                </p>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {auditLogs.slice(0, 5).map((entry) => (
                    <div key={String(entry.id)} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="mt-0.5 rounded-lg bg-secondary-50 p-2 text-secondary-600 dark:bg-secondary-950/30 dark:text-secondary-300">
                        <ScrollText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatActionType(entry.action_type)}
                        </p>
                        <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                          {entry.actor_username ?? t('admin:systemActor')} · {entry.target_resource || t('common:notAvailable')}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500" dateTime={entry.timestamp}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right column */}
        <div className="space-y-6">
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

          {/*
           * Danger Zone — Admin Account Deletion
           *
           * ANOMALY PREVENTION (Backend Requirements):
           * Before implementing the delete handler, the backend MUST enforce:
           * 1. Re-authentication: Require the admin to re-enter their password before proceeding.
           * 2. Last Admin Check: Prevent deletion if this is the ONLY admin account in the system
           *    to avoid orphaning the platform without any admin access.
           * 3. Multi-step Confirmation: Use a typed confirmation (e.g. type "DELETE MY ACCOUNT")
           *    to prevent accidental clicks.
           * 4. Ownership Transfer: Prompt to reassign owned content (questions, settings) to
           *    another admin before deletion.
           * 5. Audit Log: Record the deletion event with timestamp, IP, and actor details.
           * 6. Soft Delete / Grace Period: Consider a 30-day grace period before permanent
           *    deletion so the action can be reversed if needed.
           */}
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
