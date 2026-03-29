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
      detail: 'Auth requests are connected to backend endpoints.',
    },
  },
  {
    match: (p) => p === '/student/profile' || p === '/admin/profile',
    info: {
      status: 'partial',
      label: 'Partially Integrated',
      detail: 'User identity is backend-backed, while some page metrics are still static.',
    },
  },
  {
    match: (p) => p.startsWith('/student') || p.startsWith('/admin'),
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
