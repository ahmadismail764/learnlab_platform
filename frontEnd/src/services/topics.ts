import { api } from './api';

export const topicsService = {
  getTopics: async () => {
    const response = await api.get('/topics/');
    if (!response.ok) throw new Error('Failed to fetch topics');
    return await response.json();
  },

  getTopic: async (id: number) => {
    const response = await api.get(`/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch topic');
    return await response.json();
  },

  createTopic: async (data: any) => {
    const response = await api.post('/topics/', data);
    if (!response.ok) throw new Error('Failed to create topic');
    return await response.json();
  },

  updateTopic: async (id: number, data: any) => {
    const response = await api.put(`/topics/${id}/`, data);
    if (!response.ok) throw new Error('Failed to update topic');
    return await response.json();
  },

  deleteTopic: async (id: number) => {
    const response = await api.delete(`/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to delete topic');
    return await response.json();
  }
};
