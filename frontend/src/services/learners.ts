import { api } from './api';
import type { BackendAuthUser } from './auth';

export interface LearnerProfile {
  id: number;
  user: BackendAuthUser;
  total_xp: number;
  streak_count: number;
  last_practice_date: string | null;
}

export type LeaderboardLearner = LearnerProfile;

export const learnersService = {
  getCurrentProfile: async () => {
    const response = await api.get('/auth/learner/me/');
    if (!response.ok) throw new Error('Failed to fetch learner profile');
    return await response.json() as LearnerProfile;
  },

  getLeaderboard: async () => {
    const response = await api.get('/auth/leaderboard/global/');
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    const data = await response.json();
    // Handle both paginated ({ results: [...] }) and plain array responses
    return (Array.isArray(data) ? data : data.results ?? []) as LeaderboardLearner[];
  },

  getTopicLeaderboard: async (topicId: string | number) => {
    const response = await api.get(`/auth/leaderboard/topic/${topicId}/`);
    if (!response.ok) throw new Error('Failed to fetch topic leaderboard');
    const data = await response.json();
    return (Array.isArray(data) ? data : data.results ?? []) as LeaderboardLearner[];
  }
};
