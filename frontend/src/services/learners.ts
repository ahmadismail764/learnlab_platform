import { api } from './api';
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
  joined_at?: string;
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
    date_joined: raw.date_joined ?? raw.joined_at ?? new Date().toISOString(),
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
  getCurrentProfile: async (): Promise<LearnerProfile> => {
    // Prefer the canonical current-user endpoint (also returns XP / streak fields)
    try {
      const response = await api.get('/auth/users/me/');
      if (response.ok) {
        const data = await response.json();
        return normalizeLearnerProfile(data as RawLearnerProfile);
      }
    } catch {
      // Fall through to auth-based profile
    }

    // Fallback: older backends may not expose /auth/users/me/ reliably.
    // In that case, try the learners list and match the current user ID.
    try {
      const currentUser = await authService.getCurrentUser({ allowFallback: true });
      const response = await api.get('/practice/learners/');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.results ?? [];
        const match = list.find((item: RawLearnerProfile) => {
          const candidate = item.user?.id ?? item.id;
          return candidate != null && String(candidate) === String(currentUser.id);
        });
        if (match) {
          return normalizeLearnerProfile(match);
        }
      }
      return normalizeLearnerProfile(currentUser);
    } catch {
      // Final fallback: snapshot/JWT-derived user (XP/streak may be missing).
    }

    return normalizeLearnerProfile(
      await authService.getCurrentUser({ allowFallback: true }),
    );
  },

  getLeaderboard: async (): Promise<LeaderboardLearner[]> => {
    const response = await api.get('/practice/learners/leaderboard/');
    if (!response.ok) {
      console.warn('Leaderboard fetch failed with status:', response.status);
      return [];
    }
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.map((item: RawLearnerProfile) => normalizeLearnerProfile(item));
  },

  getTopicLeaderboard: async (topicId: string | number): Promise<LeaderboardLearner[]> => {
    const response = await api.get(`/practice/learners/leaderboard/?topic=${topicId}`);
    if (!response.ok) {
      console.warn('Topic leaderboard fetch failed with status:', response.status);
      return [];
    }
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.map((item: RawLearnerProfile) => normalizeLearnerProfile(item));
  },
};
