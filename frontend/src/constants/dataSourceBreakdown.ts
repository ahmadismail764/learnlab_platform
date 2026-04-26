export type DataSourceType = 'backend' | 'partial' | 'static'

export interface DataSourceItem {
  aspect: string
  source: DataSourceType
  note?: string
}

const authItems: DataSourceItem[] = [
  { aspect: 'Login request', source: 'backend', note: 'POST /api/v1/auth/login/' },
  { aspect: 'Register request', source: 'backend', note: 'POST /api/v1/auth/register/' },
  { aspect: 'Current user fetch', source: 'backend', note: 'GET /api/v1/auth/users/me/' },
  { aspect: 'Forgot password flow', source: 'static', note: 'UI placeholder only' },
]

const learnerItems: DataSourceItem[] = [
  { aspect: 'Learner dashboard metrics', source: 'static', note: 'Mock cards and summary values' },
  { aspect: 'Topics list/progress', source: 'static', note: 'Page-level mock content still used' },
  { aspect: 'Practice sessions', source: 'partial', note: 'Service wired to /sessions/ and /sessions/generate-adaptive/, page still partly static' },
  { aspect: 'Progress analytics', source: 'static', note: 'Mock charts/series' },
  { aspect: 'Achievements', source: 'static', note: 'Mock achievement feed' },
  { aspect: 'Leaderboard', source: 'partial', note: 'Global/topic rankings use /api/v1/auth/leaderboard/*; some display fields remain demo values' },
  { aspect: 'Profile identity', source: 'backend', note: 'Auth user loaded from /api/v1/auth/users/me/' },
  { aspect: 'Profile learning stats', source: 'partial', note: 'XP/streak load from /api/v1/auth/learners/me/ while some cards are static' },
]

const adminItems: DataSourceItem[] = [
  { aspect: 'Admin dashboard cards', source: 'static', note: 'Mock overview data' },
  { aspect: 'Topics management', source: 'static', note: 'Mock module/topic structure' },
  { aspect: 'Question bank list', source: 'static', note: 'Mock data + local actions' },
  { aspect: 'Analytics data', source: 'partial', note: 'Overview uses /api/v1/analytics/aggregated/ + /api/v1/auth/leaderboard/global/; detailed charts remain mock' },
  { aspect: 'Settings', source: 'static', note: 'Mock preferences save/reset' },
  { aspect: 'Admin profile identity', source: 'backend', note: 'Profile identity/edit uses /api/v1/auth/users/me/' },
  { aspect: 'Admin profile stats/actions', source: 'partial', note: 'System stats use analytics + leaderboard, while recent activity remains static' },
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
