import { api } from './api';

export interface LeaderboardStudent {
  id: number;
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    date_joined: string;
  };
  total_xp: number;
  streak_count: number;
  last_practice_date: string | null;
}

export const studentsService = {
  getCurrentStudent: async () => {
    const response = await api.get('/auth/learner/me/');
    if (!response.ok) throw new Error('Failed to fetch student profile');
    return await response.json();
  },

  updateCurrentStudent: async (data: any) => {
    const response = await api.patch('/auth/learner/me/', data);
    if (!response.ok) throw new Error('Failed to update student profile');
    return await response.json();
  },

  getLeaderboard: async () => {
    const response = await api.get('/auth/leaderboard/global/');
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json() as LeaderboardStudent[];
  },

  getMastery: async () => {
    const response = await api.get('/mastery/');
    if (!response.ok) throw new Error('Failed to fetch mastery');
    return await response.json();
  }
};
