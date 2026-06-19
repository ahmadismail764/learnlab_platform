import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminsService } from '@/services/admins'
import { api } from '@/services/api'

vi.mock('@/services/api', () => {
  return {
    api: {
      get: vi.fn(),
    },
  }
})

vi.mock('@/services/auth', () => {
  return {
    authService: {
      getCurrentUser: vi.fn(),
    },
  }
})

describe('adminsService operational contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches admin audit logs from the merged endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 'audit-1',
            actor: 'user-1',
            actor_username: 'admin',
            action_type: 'preferences_updated',
            target_resource: 'User/user-1',
            timestamp: '2026-06-19T10:00:00Z',
            metadata: {},
          },
        ],
      }),
    } as unknown as Response)

    const logs = await adminsService.getAuditLogs()

    expect(api.get).toHaveBeenCalledWith('/admin/audit-logs/')
    expect(logs).toHaveLength(1)
    expect(logs[0].action_type).toBe('preferences_updated')
  })

  it('fetches backend system health telemetry from the merged endpoint', async () => {
    const health = {
      cpu: { percent: 12 },
      memory: { total_mb: 1000, used_mb: 500, percent: 50 },
      disk: { total_gb: 100, used_gb: 40, percent: 40 },
      database: { status: 'ok', latency_ms: 5 },
      uptime_seconds: 3600,
      avg_api_latency_ms: 25,
    }
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: true,
      json: async () => health,
    } as unknown as Response)

    const result = await adminsService.getSystemHealth()

    expect(api.get).toHaveBeenCalledWith('/admin/system-health/')
    expect(result.database.status).toBe('ok')
    expect(result.memory.percent).toBe(50)
  })
})
