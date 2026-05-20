import type { BackendAuthUser } from './auth';

export interface AdminProfile {
  id: number | string;
  user: BackendAuthUser;
}

export const adminsService = {
  getCurrentProfile: async () => {
    throw new Error('Admin profile endpoint is not available on this backend.');
  }
};
