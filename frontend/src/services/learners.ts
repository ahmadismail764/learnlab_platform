import { api } from './api';

export const learnersService = {
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard/global/');
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json();
  },

  getTopicLeaderboard: async (topicId: string | number) => {
    const response = await api.get(`/leaderboard/topic/${topicId}/`);
    if (!response.ok) throw new Error('Failed to fetch topic leaderboard');
    return await response.json();
  },

  getMastery: async () => {
    const response = await api.get('/mastery/');
    if (!response.ok) throw new Error('Failed to fetch mastery');
    return await response.json();
  }
};
