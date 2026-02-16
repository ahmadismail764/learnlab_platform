import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Mail,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Zap,
  Trophy,
  Shield,
  Edit3,
  Lock,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Avatar, Badge, Input, ProgressBar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * StudentProfilePage
 *
 * Profile page for students showing:
 * - Personal info with avatar
 * - Learning statistics
 * - Top performing topics
 * - Recent activity feed
 * - Account settings (password, danger zone)
 */

export function StudentProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'auth', 'topics', 'gamification'])
  const user = useCurrentUser()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Mock learning stats
  const stats = {
    questionsAnswered: 342,
    accuracy: 78,
    studyTime: 47.5,
    currentStreak: 12,
    totalXP: 2450,
    level: 8,
  }

  // Mock top topics
  const topTopics = [
    { nameKey: 'topics:logic.propositional', progress: 92, icon: '🔢' },
    { nameKey: 'topics:sets.operations', progress: 85, icon: '∪' },
    { nameKey: 'topics:logic.predicates', progress: 78, icon: '∀' },
  ]

  // Mock recent activity
  const recentActivity = [
    { type: 'practice' as const, topic: 'topics:logic.propositional', score: 90, xp: 45, time: '2h ago', questionsCount: 10 },
    { type: 'practice' as const, topic: 'topics:sets.operations', score: 75, xp: 30, time: '1d ago', questionsCount: 8 },
    { type: 'achievement' as const, topic: 'gamification:badges.topicMaster', score: 0, xp: 100, time: '2d ago', questionsCount: 0 },
    { type: 'practice' as const, topic: 'topics:relations.equivalence', score: 85, xp: 40, time: '3d ago', questionsCount: 12 },
  ]

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
              <Badge variant="primary" size="sm">
                {t('auth:student')}
              </Badge>
              <Badge variant="accent" size="sm">
                {t('gamification:level', { level: stats.level })}
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
        {/* Left column: Info + Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
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

          {/* Learning Statistics */}
          <Card>
            <CardHeader
              title={t('profile:learningStats')}
              subtitle={t('profile:learningStatsDescription')}
            />
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <div className="p-2 bg-primary-100 dark:bg-primary-800/30 rounded-lg w-fit mx-auto mb-2">
                    <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.questionsAnswered}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:questionsAnswered')}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg w-fit mx-auto mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.accuracy}%</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:accuracy')}</p>
                </div>
                <div className="text-center p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl">
                  <div className="p-2 bg-secondary-100 dark:bg-secondary-800/30 rounded-lg w-fit mx-auto mb-2">
                    <Clock className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.studyTime}h</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:studyTime')}</p>
                </div>
                <div className="text-center p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                  <div className="p-2 bg-accent-100 dark:bg-accent-800/30 rounded-lg w-fit mx-auto mb-2">
                    <Zap className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.currentStreak}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile:currentStreak')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Topics */}
          <Card>
            <CardHeader title={t('profile:topPerformingTopics')} />
            <CardContent>
              <div className="space-y-4">
                {topTopics.map((topic) => (
                  <div key={topic.nameKey} className="flex items-center gap-4">
                    <span className="text-2xl">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                          {t(topic.nameKey)}
                        </span>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {topic.progress}%
                        </span>
                      </div>
                      <ProgressBar
                        value={topic.progress}
                        size="sm"
                        variant={topic.progress >= 90 ? 'success' : topic.progress >= 70 ? 'primary' : 'accent'}
                        showLabel={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader
              title={t('profile:recentActivity')}
              subtitle={t('profile:recentActivityDescription')}
            />
            <CardContent>
              <div className="space-y-1">
                {recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'achievement'
                        ? 'bg-accent-100 dark:bg-accent-900/30'
                        : 'bg-primary-100 dark:bg-primary-900/30'
                    }`}>
                      {activity.type === 'achievement'
                        ? <Trophy className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                        : <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                        {activity.type === 'achievement'
                          ? `🏆 ${t(activity.topic)}`
                          : `${t('profile:practiced')} ${t(activity.topic)}`
                        }
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activity.type === 'practice'
                          ? `${t('profile:scored')} ${activity.score}% · ${activity.questionsCount} ${t('profile:questionsCompleted')}`
                          : `${t('profile:earned')} +${activity.xp} ${t('profile:xp')}`
                        }
                      </p>
                    </div>
                    <div className="text-end">
                      <Badge variant={activity.type === 'achievement' ? 'accent' : 'primary'} size="sm">
                        +{activity.xp} XP
                      </Badge>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: XP + Password + Danger */}
        <div className="space-y-6">
          {/* XP Summary */}
          <Card>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{stats.totalXP}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('gamification:totalXP')}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  <span>{t('gamification:level', { level: stats.level })}</span>
                  <span>{t('gamification:level', { level: stats.level + 1 })}</span>
                </div>
                <ProgressBar value={65} size="sm" variant="accent" showLabel={false} />
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  {t('gamification:xpToNextLevel', { amount: 550 })}
                </p>
              </div>
            </div>
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
