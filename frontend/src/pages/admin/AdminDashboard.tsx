import { 
  Users, 
  BookOpen, 
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, Avatar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * AdminDashboard
 * 
 * System overview for administrators with branded visual identity.
 * Uses the teal-to-violet gradient for hero section.
 */

export function AdminDashboard() {
  const { t } = useTranslation('admin')
  const user = useCurrentUser()

  // Mock data
  const stats = {
    totalUsers: 1247,
    learners: 1150,
    admins: 8,
    activeToday: 423,
    newThisWeek: 34,
  }

  const recentUsers = [
    { id: '1', name: 'يوسف محمد', email: 'youssef@school.com', roleKey: 'auth:learner', hoursAgo: 2 },
    { id: '3', name: 'زينب  السيد', email: 'zainab@school.com', roleKey: 'auth:learner', daysAgo: 1 },
  ]

  const systemHealth = [
    { nameKey: 'admin:apiResponseTime', value: '45ms', status: 'good' },
    { nameKey: 'admin:database', value: '99.9%', status: 'good' },
    { nameKey: 'admin:storage', value: '67%', status: 'warning' },
    { nameKey: 'admin:activeSessions', value: '423', status: 'good' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero — branded gradient with admin context */}
      <Card className="relative overflow-hidden bg-linear-to-br from-secondary-600 via-secondary-500 to-primary-600 text-white border-0">
        {/* Decorative graph nodes */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <circle cx="480" cy="30" r="5" fill="white"/>
            <circle cx="530" cy="70" r="4" fill="white"/>
            <circle cx="440" cy="90" r="6" fill="white"/>
            <circle cx="510" cy="130" r="5" fill="white"/>
            <line x1="480" y1="30" x2="530" y2="70" stroke="white" strokeWidth="1.5"/>
            <line x1="530" y1="70" x2="510" y2="130" stroke="white" strokeWidth="1.5"/>
            <line x1="440" y1="90" x2="510" y2="130" stroke="white" strokeWidth="1.5"/>
            <line x1="480" y1="30" x2="440" y2="90" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-accent-300" />
            <p className="text-white/70 text-sm">{t('admin:adminDashboard')}</p>
          </div>
          <h1 className="text-2xl font-bold font-display">
            {t('admin:welcomeBackAdmin', { name: user.firstName })}
          </h1>
        </div>
      </Card>

      {/* Stats Grid — branded */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalUsers}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:totalUsers')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.activeToday}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:activeToday')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-100 dark:bg-accent-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">+{stats.newThisWeek}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:newThisWeek')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-secondary-700 dark:text-secondary-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.learners}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:learners')}</p>
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
                <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <p className="text-3xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.learners}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:learners')}</p>
                </div>
                <div className="text-center p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl">
                  <p className="text-3xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalUsers}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:totalUsers')}</p>
                </div>
                <div className="text-center p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                  <p className="text-3xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.admins}</p>
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
