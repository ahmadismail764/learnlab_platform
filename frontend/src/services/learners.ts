import { authService, type BackendAuthUser } from './auth';

export interface LearnerProfile {
  id: number | string;
  user: BackendAuthUser;
  total_xp: number;
  streak_count: number;
  last_practice_date: string | null;
}

export type LeaderboardLearner = LearnerProfile;

interface RawLearnerProfile extends Partial<Omit<LearnerProfile, 'user'>> {
  user?: Partial<BackendAuthUser>;
  current_xp?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  role?: string;
  is_staff?: boolean;
  date_joined?: string;
}


function normalizeBackendUser(raw: Partial<BackendAuthUser>): BackendAuthUser {
  const username = raw.username || raw.email?.split('@')[0] || 'learner';
  return {
    id: raw.id ?? username,
    username,
    email: raw.email ?? '',
    first_name: raw.first_name ?? '',
    last_name: raw.last_name ?? '',
    role: raw.role ?? (raw.is_staff ? 'admin' : 'learner'),
    is_staff: raw.is_staff ?? raw.role === 'admin',
    date_joined: raw.date_joined ?? new Date().toISOString(),
  };
}

function normalizeLearnerProfile(raw: RawLearnerProfile | BackendAuthUser): LearnerProfile {
  const profile = raw as RawLearnerProfile;
  const rawUser = profile.user ? profile.user : raw;
  const user = normalizeBackendUser(rawUser);

  return {
    id: profile.id ?? user.id,
    user,
    total_xp: Number(profile.total_xp ?? profile.current_xp ?? 0),
    streak_count: Number(profile.streak_count ?? 0),
    last_practice_date: profile.last_practice_date ?? null,
  };
}

export const learnersService = {
  getCurrentProfile: async () => {
    return normalizeLearnerProfile(
      await authService.getCurrentUser({ allowFallback: true }),
    );
  },

  getLeaderboard: async () => {
    return [];
  },

  getTopicLeaderboard: async (topicId: string | number) => {
    void topicId;
    return [];
  }
};
