import { api } from './api';
import type { BackendAuthUser } from './auth';
import { coerceBackendUser } from './mappers/backendUser';

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
  joined_at?: string;
}

function normalizeLearnerProfile(raw: RawLearnerProfile | BackendAuthUser): LearnerProfile {
  const profile = raw as RawLearnerProfile;
  const rawUser = profile.user ? profile.user : raw;
  const user = coerceBackendUser(rawUser);

  return {
    id: profile.id ?? user.id,
    user,
    total_xp: Number(profile.total_xp ?? profile.current_xp ?? 0),
    streak_count: Number(profile.streak_count ?? 0),
    last_practice_date: profile.last_practice_date ?? null,
  };
}

export const learnersService = {
  getCurrentProfile: async (): Promise<LearnerProfile> => {
    const response = await api.get('/auth/users/me/');
    if (!response.ok) {
      throw new Error('Failed to fetch current learner profile');
    }

    const data = await response.json();
    return normalizeLearnerProfile(data as RawLearnerProfile);
  },

  getLeaderboard: async (): Promise<LeaderboardLearner[]> => {
    const response = await api.get('/practice/leaderboard/');
    if (!response.ok) {
      console.warn('Leaderboard fetch failed with status:', response.status);
      return [];
    }
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.map((item: RawLearnerProfile) => normalizeLearnerProfile(item));
  },

  getTopicLeaderboard: async (topicId: string | number): Promise<LeaderboardLearner[]> => {
    const response = await api.get(`/practice/leaderboard/?topic=${topicId}`);
    if (!response.ok) {
      console.warn('Topic leaderboard fetch failed with status:', response.status);
      return [];
    }
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.map((item: RawLearnerProfile) => normalizeLearnerProfile(item));
  },
};
