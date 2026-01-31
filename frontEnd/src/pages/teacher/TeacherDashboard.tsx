import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, ProgressBar, Avatar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * TeacherDashboard
 * 
 * Overview for instructors showing:
 * - Class overview
 * - Student performance
 * - Action items
 */

export function TeacherDashboard() {
  const { t } = useTranslation()
  const user = useCurrentUser()

  // Mock data
  const stats = {
    totalStudents: 48,
    activeToday: 32,
    averageProgress: 67,
    needsAttention: 5,
  }

  const classes = [
    { id: '1', name: 'Math 101', students: 24, avgProgress: 72, subjectKey: 'subjects.mathematics' },
    { id: '2', name: 'Science 3A', students: 24, avgProgress: 61, subjectKey: 'subjects.science' },
  ]

  const studentsNeedingHelp = [
    { id: '1', name: 'نورة العلي', subjectKey: 'subjects.fractions', streak: 0, daysAgo: 3 },
    { id: '2', name: 'عمر الحسن', subjectKey: 'subjects.algebra', streak: 1, daysAgo: 2 },
    { id: '3', name: 'سارة محمد', subjectKey: 'subjects.geometry', streak: 0, daysAgo: 5 },
  ]

  const recentActivity = [
    { id: '1', student: 'ليلى أحمد', action: 'completed', topicKey: 'subjects.multiplication', minutesAgo: 5 },
    { id: '2', student: 'خالد عبدالله', action: 'struggling', topicKey: 'subjects.division', minutesAgo: 12 },
    { id: '3', student: 'مريم سالم', action: 'mastered', topicKey: 'subjects.addition', minutesAgo: 18 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          {t('teacher.goodMorning', { name: user.firstName })}
        </h1>
        <p className="text-neutral-600 mt-1">
          {t('teacher.whatsHappening')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Users className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.totalStudents}</p>
              <p className="text-xs text-neutral-500">{t('teacher.totalStudents')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.activeToday}</p>
              <p className="text-xs text-neutral-500">{t('teacher.activeToday')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.averageProgress}%</p>
              <p className="text-xs text-neutral-500">{t('teacher.avgProgress')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.needsAttention}</p>
              <p className="text-xs text-neutral-500">{t('teacher.needAttention')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Classes & Students Needing Help */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Classes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">{t('teacher.myClasses')}</h2>
              <Link to="/teacher/classes" className="text-sm text-primary-600 hover:text-primary-700">
                {t('common:viewAll')}
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Card key={cls.id} hoverable>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-neutral-800">{cls.name}</h3>
                      <p className="text-sm text-neutral-500">{t(cls.subjectKey)}</p>
                    </div>
                    <Badge variant="secondary">{cls.students} {t('admin.students').toLowerCase()}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">{t('teacher.classProgress')}</span>
                      <span className="font-medium">{cls.avgProgress}%</span>
                    </div>
                    <ProgressBar value={cls.avgProgress} size="sm" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Students Needing Attention */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">
                <AlertCircle className="w-5 h-5 text-amber-500 inline me-2" />
                {t('teacher.studentsNeedingHelp')}
              </h2>
            </div>
            
            <Card>
              <div className="divide-y divide-neutral-100">
                {studentsNeedingHelp.map((student) => (
                  <div key={student.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size="sm" />
                      <div>
                        <p className="font-medium text-neutral-800">{student.name}</p>
                        <p className="text-sm text-neutral-500">
                          {t('teacher.strugglingWith', { subject: t(student.subjectKey) })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-end text-sm">
                        <p className="text-neutral-500">{t('time.daysAgo', { count: student.daysAgo })}</p>
                        {student.streak === 0 && (
                          <Badge variant="warning" size="sm">{t('teacher.lostStreak')}</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-800">{t('teacher.recentActivity')}</h2>
          
          <Card>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar name={activity.student} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium text-neutral-800">{activity.student}</span>
                      {' '}
                      <span className={
                        activity.action === 'mastered' ? 'text-green-600' :
                        activity.action === 'struggling' ? 'text-amber-600' :
                        'text-neutral-600'
                      }>
                        {t(`teacher.${activity.action}`)}
                      </span>
                      {' '}
                      <span className="text-neutral-600">{t(activity.topicKey)}</span>
                    </p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {t('time.minutesAgo', { count: activity.minutesAgo })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title={t('teacher.quickActions')} />
            <CardContent className="space-y-2">
              <Button variant="primary" fullWidth>
                {t('teacher.createAssignment')}
              </Button>
              <Button variant="outline" fullWidth>
                {t('teacher.viewAnalytics')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
