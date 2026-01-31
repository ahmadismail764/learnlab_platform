import { 
  FileCheck, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ChevronRight,
  Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Badge, Avatar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'

/**
 * SupervisorDashboard
 * 
 * Overview for academic advisors showing:
 * - Content review status
 * - Student performance overview
 * - Pending approvals
 * 
 * Note: Quick actions and view buttons are currently static (not functional)
 */

export function SupervisorDashboard() {
  const { t } = useTranslation(['admin', 'common', 'topics'])
  const user = useCurrentUser()

  // Mock data - Egyptian Arabic names
  const stats = {
    pendingReviews: 12,
    approvedToday: 8,
    studentsMonitored: 156,
    flaggedContent: 3,
  }

  const pendingQuestions = [
    { 
      id: '1', 
      topic: 'topics:logic.propositional', 
      tier: 2, 
      submittedBy: 'أحمد محمود',
      submittedAt: '2 hours ago',
      status: 'pending'
    },
    { 
      id: '2', 
      topic: 'topics:sets.operations', 
      tier: 1, 
      submittedBy: 'فاطمة علي',
      submittedAt: '5 hours ago',
      status: 'pending'
    },
    { 
      id: '3', 
      topic: 'topics:combinatorics.permutations', 
      tier: 3, 
      submittedBy: 'محمد حسن',
      submittedAt: '1 day ago',
      status: 'needs_revision'
    },
  ]

  const recentApprovals = [
    { id: '1', topic: 'topics:graphTheory.basics', count: 5, approvedAt: '1 hour ago' },
    { id: '2', topic: 'topics:numberTheory.gcd', count: 3, approvedAt: '3 hours ago' },
    { id: '3', topic: 'topics:relations.equivalence', count: 4, approvedAt: 'Yesterday' },
  ]

  const studentAlerts = [
    { id: '1', name: 'يوسف إبراهيم', issue: 'Low engagement - 5 days inactive', severity: 'warning' },
    { id: '2', name: 'نور الدين أحمد', issue: 'Struggling with Logic topics', severity: 'info' },
    { id: '3', name: 'مريم السيد', issue: 'Significant progress drop', severity: 'warning' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-neutral-600 mt-1">
          Content review and student monitoring overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.pendingReviews}</p>
              <p className="text-xs text-neutral-500">Pending Reviews</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.approvedToday}</p>
              <p className="text-xs text-neutral-500">Approved Today</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Users className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.studentsMonitored}</p>
              <p className="text-xs text-neutral-500">Students Monitored</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.flaggedContent}</p>
              <p className="text-xs text-neutral-500">Flagged Content</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">
                <FileCheck className="w-5 h-5 text-amber-500 inline me-2" />
                Pending Content Reviews
              </h2>
              <Link to="/supervisor/review" className="text-sm text-primary-600 hover:text-primary-700">
                {t('common:viewAll')}
              </Link>
            </div>
            
            <Card>
              <div className="divide-y divide-neutral-100">
                {pendingQuestions.map((question) => (
                  <div key={question.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-neutral-800">{t(question.topic)}</p>
                        <Badge 
                          variant={question.tier === 1 ? 'success' : question.tier === 2 ? 'warning' : 'error'}
                          size="sm"
                        >
                          Tier {question.tier}
                        </Badge>
                        {question.status === 'needs_revision' && (
                          <Badge variant="error" size="sm">Needs Revision</Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">
                        Submitted by {question.submittedBy} • {question.submittedAt}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Approvals */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-800">Recent Approvals</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {recentApprovals.map((approval) => (
                <Card key={approval.id} padding="sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-neutral-800">{approval.count} questions</span>
                  </div>
                  <p className="text-sm text-neutral-600">{t(approval.topic)}</p>
                  <p className="text-xs text-neutral-400 mt-1">{approval.approvedAt}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Student Alerts & Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-800">
            <AlertTriangle className="w-5 h-5 text-amber-500 inline me-2" />
            Student Alerts
          </h2>
          
          <Card>
            <div className="space-y-3">
              {studentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50">
                  <Avatar name={alert.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 text-sm">{alert.name}</p>
                    <p className={`text-xs ${
                      alert.severity === 'warning' ? 'text-amber-600' : 'text-secondary-600'
                    }`}>
                      {alert.issue}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions - Static buttons */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent className="space-y-2">
              <Button variant="primary" fullWidth>
                Review All Pending
              </Button>
              <Button variant="outline" fullWidth>
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {/* Info notice */}
          <div className="p-3 bg-secondary-50 rounded-lg text-sm text-secondary-700">
            <p className="font-medium mb-1">📋 Note</p>
            <p>Quick action buttons are not yet functional. Full review workflow coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
