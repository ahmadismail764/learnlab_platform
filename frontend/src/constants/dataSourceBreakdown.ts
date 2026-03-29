export type DataSourceType = 'backend' | 'partial' | 'static'

export interface DataSourceItem {
  aspect: string
  source: DataSourceType
  note?: string
}

const authItems: DataSourceItem[] = [
  { aspect: 'Login request', source: 'backend', note: 'POST /api/v1/auth/login/' },
  { aspect: 'Register request', source: 'backend', note: 'POST /api/v1/auth/register/' },
  { aspect: 'Current user fetch', source: 'backend', note: 'GET /api/v1/users/me/' },
  { aspect: 'Forgot password flow', source: 'static', note: 'UI placeholder only' },
]

const studentItems: DataSourceItem[] = [
  { aspect: 'Student dashboard metrics', source: 'static', note: 'Mock cards and summary values' },
  { aspect: 'Topics list/progress', source: 'static', note: 'Page-level mock content still used' },
  { aspect: 'Practice sessions', source: 'partial', note: 'Service wired to /sessions/, page still partly static' },
  { aspect: 'Progress analytics', source: 'static', note: 'Mock charts/series' },
  { aspect: 'Achievements', source: 'static', note: 'Mock achievement feed' },
  { aspect: 'Leaderboard', source: 'static', note: 'Mock ranking data on page' },
  { aspect: 'Profile identity', source: 'backend', note: 'Auth user loaded from backend' },
  { aspect: 'Profile learning stats', source: 'static', note: 'Mock profile metrics' },
]

const adminItems: DataSourceItem[] = [
  { aspect: 'Admin dashboard cards', source: 'static', note: 'Mock overview data' },
  { aspect: 'Topics management', source: 'static', note: 'Mock module/topic structure' },
  { aspect: 'Question bank list', source: 'static', note: 'Mock data + local actions' },
  { aspect: 'Analytics data', source: 'partial', note: 'Analytics service available; page still mostly mock' },
  { aspect: 'Settings', source: 'static', note: 'Mock preferences save/reset' },
  { aspect: 'Admin profile identity', source: 'backend', note: 'Auth user loaded from backend' },
  { aspect: 'Admin profile stats/actions', source: 'static', note: 'Mock system stats' },
]

export function getDataSourceBreakdown(pathname: string): DataSourceItem[] {
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
    return authItems
  }
  if (pathname.startsWith('/student')) {
    return studentItems
  }
  if (pathname.startsWith('/admin')) {
    return adminItems
  }

  return [
    { aspect: 'Page data sources', source: 'static', note: 'No route-specific mapping yet' },
  ]
}
