import { 
  Users, 
  BookOpen, 
  Activity,
  TrendingUp
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, Avatar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * AdminDashboard
 * 
 * System overview for administrators showing:
 * - Platform statistics
 * - User management overview
 * - System health
 */

export function AdminDashboard() {
  const { t } = useTranslation('admin')
  const user = useCurrentUser()

  // Mock data
  const stats = {
    totalUsers: 1247,
    students: 1150,
    admins: 8,
    activeToday: 423,
    newThisWeek: 34,
  }

  const recentUsers = [
    { id: '1', name: 'يوسف محمد', email: 'youssef@school.com', roleKey: 'auth:student', hoursAgo: 2 },
    { id: '3', name: 'زينب  السيد', email: 'zainab@school.com', roleKey: 'auth:student', daysAgo: 1 },
  ]

  const systemHealth = [
    { nameKey: 'admin:apiResponseTime', value: '45ms', status: 'good' },
    { nameKey: 'admin:database', value: '99.9%', status: 'good' },
    { nameKey: 'admin:storage', value: '67%', status: 'warning' },
    { nameKey: 'admin:activeSessions', value: '423', status: 'good' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {t('admin:adminDashboard')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t('admin:welcomeBackAdmin', { name: user.firstName })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <Users className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.totalUsers}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:totalUsers')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.activeToday}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:activeToday')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">+{stats.newThisWeek}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:newThisWeek')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.students}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:students')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Breakdown & Recent Users */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Breakdown */}
          <Card>
            <CardHeader title={t('admin:userBreakdown')} />
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{stats.students}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:students')}</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{stats.students}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:students')}</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{stats.admins}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:admins')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader 
              title={t('admin:recentUsers')} 
              action={<Button variant="ghost" size="sm">{t('common:viewAll')}</Button>}
            />
            <CardContent>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-100">{u.name}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={u.roleKey === 'auth:admin' ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {t(u.roleKey)}
                      </Badge>
                      <span className="text-sm text-neutral-400">
                        {u.daysAgo ? t('time:yesterday') : t('time:hoursAgo', { count: u.hoursAgo })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader title={t('admin:systemHealth')} />
            <CardContent>
              <div className="space-y-3">
                {systemHealth.map((item) => (
                  <div key={item.nameKey} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t(item.nameKey)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.value}</span>
                      <Badge 
                        dot 
                        variant={item.status === 'good' ? 'success' : 'warning'} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}
