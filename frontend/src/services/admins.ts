import { api } from './api';
import type { BackendAuthUser } from './auth';

export interface AdminProfile {
  id: number;
  user: BackendAuthUser;
}

export const adminsService = {
  getCurrentProfile: async () => {
    const response = await api.get('/auth/admin/me/');
    if (!response.ok) throw new Error('Failed to fetch admin profile');
    return await response.json() as AdminProfile;
  }
};
