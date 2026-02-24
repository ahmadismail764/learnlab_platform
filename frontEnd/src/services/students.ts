import { api } from './api';

export const studentsService = {
  getProfile: async () => {
    const response = await api.get('/students/me/');
    if (!response.ok) throw new Error('Failed to fetch profile');
    return await response.json();
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/students/me/', data);
    if (!response.ok) throw new Error('Failed to update profile');
    return await response.json();
  },

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
