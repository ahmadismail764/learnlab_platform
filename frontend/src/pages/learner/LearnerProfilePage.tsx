import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  MapPin,
  Mail,
  Shield,
  Activity,
  Brain,
  Sparkles,
  Save,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import { Card, Button, Input, Avatar, Badge, ProgressBar, XpBadge } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { useAuth, useCurrentUser } from '@/contexts'
import { authService, AuthRequestError } from '@/services/auth'
import { useLearnerProfile, useTopicMastery } from '@/hooks'
import { useToast } from '@/contexts'
import { validateForm, profileSchema } from '@/validation'
import type { TopicMastery } from '@/constants/mastery'
import { getTopicDisplayName } from '@/utils/topicLabels'

/**
 * LearnerProfilePage (Researcher Dossier)
 * Re-imagined as a high-fidelity data dossier for the researcher.
 *
 * Backend-integrated:
 * - Identity fields (username, email, first/last name) via PATCH /api/v1/auth/users/me/
 * - Learner stats (XP, streak) via GET /api/v1/auth/users/me/
 * - Topic mastery via GET /api/v1/mastery/
 */

export function LearnerProfilePage() {
  const { t } = useTranslation(['profile', 'learner', 'common', 'topics'])
  const user = useCurrentUser()
  const { updateUser, logout } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  // Data fetching via React Query — cached, deduplicated, auto-refreshed
  const { data: learnerProfile } = useLearnerProfile()
  const { data: rawMasteries, isLoading: masteryLoading } = useTopicMastery()
  const topicMasteries = useMemo(
    () => (rawMasteries ?? []) as TopicMastery[],
    [rawMasteries]
  )

  const [profileForm, setProfileForm] = useState({
    username: user.username ?? user.email.split('@')[0],
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  })

  useEffect(() => {
    setProfileForm({
      username: user.username ?? user.email.split('@')[0],
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })
  }, [user.username, user.email, user.firstName, user.lastName])

  const memberSinceYear = useMemo(() => {
    const parsed = new Date(user.createdAt)
    return Number.isNaN(parsed.getTime()) ? t('common:notAvailable') : String(parsed.getFullYear())
  }, [user.createdAt, t])

  // Compute mastery index from normalized FSRS retrievability scores.
  const masteryIndex = useMemo(() => {
    if (topicMasteries.length === 0) return null
    const avgMemory = topicMasteries.reduce((sum, m) => sum + Math.min(1, m.memory || 0), 0) / topicMasteries.length
    return Math.round(avgMemory * 100)
  }, [topicMasteries])

  const researchStats = useMemo(
    () => [
      {
        label: t('profile:xp'),
        val: learnerProfile ? learnerProfile.total_xp.toLocaleString() : '--',
        icon: <XpBadge size="lg" />,
        tone: 'primary' as const,
      },
      {
        label: t('profile:currentStreak'),
        val: learnerProfile ? t('learner:streakDaysValue', { count: learnerProfile.streak_count }) : '--',
        icon: <Activity className="h-5 w-5" />,
        tone: 'accent' as const,
      },
      {
        label: t('learner:topicMastery'),
        val: masteryIndex !== null ? `${masteryIndex}%` : '--',
        icon: <Brain className="h-5 w-5" />,
        tone: 'secondary' as const,
      },
      {
        label: t('profile:role'),
        val: user.role === 'admin' ? t('common:admin') : t('common:learner'),
        icon: <Shield className="h-5 w-5" />,
        tone: 'success' as const,
      },
    ],
    [learnerProfile, masteryIndex, user.role, t],
  )

  // Top topics sorted by memory (descending), limited to 3
  const topTopics = useMemo(() => {
    if (topicMasteries.length === 0) return []
    return [...topicMasteries]
      .sort((a, b) => (b.memory || 0) - (a.memory || 0))
      .slice(0, 3)
      .map((m) => {
        const progress = Math.round(Math.min(1, m.memory || 0) * 100)
        const statusLabels: Record<string, string> = {
          learned: t('learner:stateMastered'),
          learning: t('learner:stateLearning'),
          struggling: t('learner:stateStruggling'),
          new: t('learner:stateNew'),
        }
        return {
          name: getTopicDisplayName(t, m.subtopic_name),
          level: m.status ? (statusLabels[m.status] || t('learner:stateNew')) : t('learner:stateNew'),
          progress,
        }
      })
  }, [topicMasteries, t])

  // Mastery path overall progress
  const overallMastery = useMemo(() => {
    if (topicMasteries.length === 0) return 0
    return Math.round(
      topicMasteries.reduce((sum, m) => sum + Math.min(1, m.memory || 0), 0) / topicMasteries.length * 100
    )
  }, [topicMasteries])

  const handleSyncProfile = async () => {
    if (!isEditing) {
      setIsEditing(true)
      setSaveError('')
      return
    }

    setIsSaving(true)
    setSaveError('')

    const validation = validateForm(profileSchema, profileForm)
    if (!validation.success) {
      setSaveError(Object.values(validation.fieldErrors).join('; '))
      setIsSaving(false)
      return
    }

    try {
      const payload = {
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        first_name: profileForm.firstName.trim(),
        last_name: profileForm.lastName.trim(),
      }

      const updated = await authService.updateCurrentUser(payload)

      updateUser({
        username: updated.username,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        role: updated.role === 'admin' || updated.role === 'learner'
          ? updated.role
          : updated.is_staff
            ? 'admin'
            : 'learner',
      })

      setIsEditing(false)
      showSuccess(t('profile:profileSyncSuccess'))
    } catch (error) {
      if (error instanceof AuthRequestError && error.fieldErrors) {
        const messages = Object.values(error.fieldErrors).join('; ')
        setSaveError(messages || error.message)
      } else {
        const message = error instanceof Error ? error.message : t('profile:profileSyncFailed')
        setSaveError(message)
      }
      showError(t('profile:profileSyncFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t('profile:myProfile')}
        title={`${user.firstName} ${user.lastName}`}
        description={t('profile:profileDescription')}
        icon={<Settings className="h-6 w-6" />}
        tone="neutral"
        actions={(
          <Button
            onClick={handleSyncProfile}
            isLoading={isSaving}
            variant={isEditing ? 'primary' : 'outline'}
            leftIcon={!isSaving ? (isEditing ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />) : undefined}
          >
            {isEditing ? t('profile:saveChanges') : t('profile:editProfile')}
          </Button>
        )}
      />

      {saveError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {saveError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Card>
            <div className="flex items-start gap-4">
              <Avatar name={`${user.firstName} ${user.lastName}`} avatarColor={user.avatarColor} size="xl" />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="primary" size="sm">
                    {user.role === 'admin' ? t('common:admin') : t('common:learner')}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {t('profile:memberSince')} {memberSinceYear}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <MapPin className="h-4 w-4 text-neutral-400" />
                <span>{t('profile:workspace')}</span>
              </div>
            </div>

            <div className="surface-inset mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">{t('profile:overallMastery')}</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {topicMasteries.length > 0 ? `${overallMastery}%` : '--'}
                </span>
              </div>
              <ProgressBar value={overallMastery} />
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                {topicMasteries.length > 0
                  ? t('profile:masteryTrackingInfo', { count: topicMasteries.length })
                  : t('profile:masteryWillAppear')}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {researchStats.map((stat, index) => {
              return (
                <PageStatCard
                  key={index}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.val}
                  tone={stat.tone}
                />
              )
            })}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <section className="space-y-4">
            <SectionHeading
              title={t('profile:profileDetails')}
              description={t('profile:profileDetailsDescription')}
            />

            <Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t('profile:username')}
                  disabled={!isEditing || isSaving}
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                />
                <Input
                  label={t('profile:email')}
                  type="email"
                  disabled={!isEditing || isSaving}
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <Input
                  label={t('profile:firstName')}
                  disabled={!isEditing || isSaving}
                  value={profileForm.firstName}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
                />
                <Input
                  label={t('profile:lastName')}
                  disabled={!isEditing || isSaving}
                  value={profileForm.lastName}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </div>

              {isEditing && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setSaveError('')
                      setProfileForm({
                        username: user.username ?? user.email.split('@')[0],
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                      })
                    }}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button onClick={handleSyncProfile} isLoading={isSaving}>
                    {t('profile:saveProfile')}
                  </Button>
                </div>
              )}
            </Card>
          </section>

          <section className="space-y-4">
            <SectionHeading
              title={t('profile:topTopics')}
              description={t('profile:topTopicsDescription')}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {masteryLoading ? (
                <Card className="md:col-span-2">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('profile:loadingMastery')}
                  </p>
                </Card>
              ) : topTopics.length === 0 ? (
                <Card className="md:col-span-2 border-dashed">
                  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                    <Sparkles className="h-8 w-8 text-neutral-300" />
                    <div className="space-y-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {t('profile:noMasteryYet')}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('profile:noMasteryDescription')}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                topTopics.map((topic, index) => (
                  <Card key={topic.name} className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                          {topic.name}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {topic.level}
                        </p>
                      </div>
                      <Badge variant="outline" size="sm">
                        #{index + 1}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">{t('profile:masteryScore')}</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {topic.progress}%
                        </span>
                      </div>
                      <ProgressBar value={topic.progress} variant="secondary" />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          <Card className="border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('profile:signOutDevice')}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {t('profile:endSession')}
                </p>
              </div>
              <Button variant="danger" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
                {t('profile:signOut')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
