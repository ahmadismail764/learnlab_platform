import { api, type EntityId } from './api';
import { authService, type BackendAuthUser } from './auth';

export interface AdminProfile {
  id: number | string;
  user: BackendAuthUser;
}

export interface AuditLogEntry {
  id: EntityId;
  actor: EntityId | null;
  actor_username: string | null;
  action_type: string;
  target_resource: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogFilters {
  action_type?: string;
  actor_id?: string;
  after?: string;
  before?: string;
}

export interface SystemHealthResponse {
  cpu: {
    percent: number | null;
  };
  memory: {
    total_mb: number | null;
    used_mb: number | null;
    percent: number | null;
  };
  disk: {
    total_gb: number | null;
    used_gb: number | null;
    percent: number | null;
  };
  database: {
    status: string;
    latency_ms: number | null;
  };
  uptime_seconds: number | null;
  avg_api_latency_ms: number | null;
}

interface PaginatedResponse<T> {
  results?: T[];
}

function toList<T>(data: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export const adminsService = {
  getCurrentProfile: async (): Promise<AdminProfile> => {
    const user = await authService.getCurrentUser();
    return { id: user.id, user };
  },

  getAuditLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => Boolean(value)) as [string, string][],
    ).toString();
    const response = await api.get(`/admin/audit-logs/${query ? `?${query}` : ''}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs (${response.status})`);
    }
    const data = await response.json() as AuditLogEntry[] | PaginatedResponse<AuditLogEntry>;
    return toList(data);
  },

  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    const response = await api.get('/admin/system-health/');
    if (!response.ok) {
      throw new Error(`Failed to fetch system health (${response.status})`);
    }
    return await response.json() as SystemHealthResponse;
  },
};
