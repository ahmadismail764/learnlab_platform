export type DataSourceType = 'backend' | 'partial' | 'static'

export interface DataSourceItem {
  aspect: string
  source: DataSourceType
  note?: string
}

const authItems: DataSourceItem[] = [
  { aspect: 'Login request', source: 'backend', note: 'POST /api/v1/auth/login/' },
  { aspect: 'Learner Register request', source: 'backend', note: 'POST /api/v1/auth/learner/register/' },
  { aspect: 'Admin Register request', source: 'backend', note: 'POST /api/v1/auth/admin/register/' },
  { aspect: 'Current user fetch', source: 'backend', note: 'GET /api/v1/auth/users/me/' },
  { aspect: 'Forgot password flow', source: 'static', note: 'UI placeholder only' },
]

const learnerItems: DataSourceItem[] = [
  { aspect: 'Learner dashboard metrics', source: 'static', note: 'Mock cards and summary values' },
  { aspect: 'Topics list/progress', source: 'backend', note: 'GET /api/v1/practice/mastery/ via FIRe data' },
  { aspect: 'Practice sessions', source: 'backend', note: 'CRUD via /api/v1/practice/sessions/ and /sessions/generate-adaptive/' },
  { aspect: 'Progress analytics', source: 'static', note: 'Mock charts/series' },
  { aspect: 'Achievements', source: 'static', note: 'Mock achievement feed' },
  { aspect: 'Leaderboard', source: 'backend', note: 'Global/topic rankings via /api/v1/auth/leaderboard/*' },
  { aspect: 'Profile identity', source: 'backend', note: 'Auth user from /api/v1/auth/users/me/, editable via PATCH' },
  { aspect: 'Profile learning stats', source: 'backend', note: 'XP/streak from /api/v1/auth/learner/me/, mastery from /api/v1/practice/mastery/' },
  { aspect: 'Notifications', source: 'static', note: 'Backend notification model exists, UI integration pending' },
]

const adminItems: DataSourceItem[] = [
  { aspect: 'Admin dashboard cards', source: 'static', note: 'Mock overview data' },
  { aspect: 'Topics management', source: 'backend', note: 'Full CRUD via /api/v1/practice/topics/' },
  { aspect: 'Question bank list', source: 'partial', note: 'Read from GET /api/v1/practice/questions/; create/edit/delete pending (ReadOnlyModelViewSet)' },
  { aspect: 'Analytics data', source: 'partial', note: 'Overview uses /api/v1/analytics/aggregated/ + /api/v1/auth/leaderboard/global/; detailed charts remain mock' },
  { aspect: 'Settings', source: 'static', note: 'Mock preferences save/reset' },
  { aspect: 'Admin profile identity', source: 'backend', note: 'Profile identity/edit uses /api/v1/auth/users/me/ and /api/v1/auth/admin/me/' },
  { aspect: 'Admin profile stats/actions', source: 'partial', note: 'System stats use analytics + leaderboard, while recent activity remains static' },
  { aspect: 'Notifications', source: 'static', note: 'Backend notification model exists, UI integration pending' },
]

export function getDataSourceBreakdown(pathname: string): DataSourceItem[] {
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
    return authItems
  }
  if (pathname.startsWith('/learner')) {
    return learnerItems
  }
  if (pathname.startsWith('/admin')) {
    return adminItems
  }

  return [
    { aspect: 'Page data sources', source: 'static', note: 'No route-specific mapping yet' },
  ]
}
