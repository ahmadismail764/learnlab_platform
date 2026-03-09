import { api } from './api';

export const studentsService = {
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard/');
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json();
  },

  getMastery: async () => {
    const response = await api.get('/mastery/');
    if (!response.ok) throw new Error('Failed to fetch mastery');
    return await response.json();
  }
};
