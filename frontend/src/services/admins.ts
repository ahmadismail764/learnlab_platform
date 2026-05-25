import { authService, type BackendAuthUser } from './auth';

export interface AdminProfile {
  id: number | string;
  user: BackendAuthUser;
}

export const adminsService = {
  getCurrentProfile: async (): Promise<AdminProfile> => {
    const user = await authService.getCurrentUser({ allowFallback: true });
    return { id: user.id, user };
  },
};
