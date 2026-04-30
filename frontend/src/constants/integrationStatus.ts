export type IntegrationStatus = 'backend' | 'partial' | 'static'

export interface IntegrationStatusInfo {
  status: IntegrationStatus
  label: string
  detail: string
}

const routeStatusMap: Array<{
  match: (pathname: string) => boolean
  info: IntegrationStatusInfo
}> = [
  {
    match: (p) => p === '/login' || p === '/register' || p === '/forgot-password',
    info: {
      status: 'backend',
      label: 'Backend Integrated',
      detail: 'Auth requests are connected to /api/v1/auth/* endpoints.',
    },
  },
  {
    match: (p) => p === '/learner/profile' || p === '/admin/profile',
    info: {
      status: 'backend',
      label: 'Backend Integrated',
      detail: 'Profile identity uses /api/v1/auth/users/me/, learner stats from /api/v1/auth/learner/me/, topic mastery from /api/v1/practice/mastery/. Password change is not yet wired.',
    },
  },
  {
    match: (p) => p === '/learner/topics',
    info: {
      status: 'backend',
      label: 'Backend Integrated',
      detail: 'Topic list from /api/v1/practice/topics/, mastery data from /api/v1/practice/mastery/ with FIRe scheduling.',
    },
  },
  {
    match: (p) => p === '/learner/practice',
    info: {
      status: 'backend',
      label: 'Backend Integrated',
      detail: 'Adaptive session generation via /api/v1/practice/sessions/generate-adaptive/, interaction submission via /api/v1/practice/interactions/, session lifecycle via /api/v1/practice/sessions/.',
    },
  },
  {
    match: (p) => p === '/learner/leaderboard',
    info: {
      status: 'backend',
      label: 'Backend Integrated',
      detail: 'Global rankings from /api/v1/auth/leaderboard/global/, topic rankings from /api/v1/auth/leaderboard/topic/{id}/.',
    },
  },
  {
    match: (p) => p === '/admin/analytics',
    info: {
      status: 'partial',
      label: 'Partially Integrated',
      detail: 'Overview cards read /api/v1/analytics/aggregated/ + /api/v1/auth/leaderboard/global/. Detailed charts remain mock/static.',
    },
  },
  {
    match: (p) => p === '/admin/topics',
    info: {
      status: 'backend',
      label: 'Backend Integrated',
      detail: 'Full CRUD via /api/v1/practice/topics/. Topics are fetched, created, edited, and deleted through the backend API.',
    },
  },
  {
    match: (p) => p === '/admin/questions',
    info: {
      status: 'partial',
      label: 'Partially Integrated',
      detail: 'Questions list and preview load from GET /api/v1/practice/questions/. Create/edit/delete are disabled because the backend uses ReadOnlyModelViewSet.',
    },
  },
  {
    match: (p) => p === '/learner/notifications' || p === '/admin/notifications',
    info: {
      status: 'static',
      label: 'UI Pending',
      detail: 'Backend Notification model exists, but no API endpoint is exposed yet. UI is pending.',
    },
  },
  {
    match: (p) => p.startsWith('/learner') || p.startsWith('/admin'),
    info: {
      status: 'static',
      label: 'Static Demo Data',
      detail: 'This screen still uses mock/static data and is pending backend wiring.',
    },
  },
]

export function getIntegrationStatus(pathname: string): IntegrationStatusInfo {
  const matched = routeStatusMap.find((entry) => entry.match(pathname))
  if (matched) return matched.info

  return {
    status: 'static',
    label: 'Static Demo Data',
    detail: 'Data source integration status is not mapped yet.',
  }
}
