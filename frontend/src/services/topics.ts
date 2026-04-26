import { api } from './api';

interface TopicPayload {
  name: string;
  description: string;
  parent_module: string;
}

export const topicsService = {
  getTopics: async () => {
    const response = await api.get(`/practice/topics/`);
    if (!response.ok) throw new Error('Failed to fetch topics');
    return await response.json();
  },

  getTopicMastery: async (filters: Record<string, string> = {}) => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/practice/mastery/?${query}`);
    if (!response.ok) throw new Error('Failed to fetch topic mastery');
    return await response.json();
  },

  getTopicDetails: async (id: number) => {
    const response = await api.get(`/practice/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch topic details');
    return await response.json();
  },

  createTopic: async (data: TopicPayload) => {
    const response = await api.post('/practice/topics/', data);
    if (!response.ok) throw new Error('Failed to create topic');
    return await response.json();
  },

  updateTopic: async (id: number, data: Partial<TopicPayload>) => {
    const response = await api.put(`/practice/topics/${id}/`, data);
    if (!response.ok) throw new Error('Failed to update topic');
    return await response.json();
  },

  deleteTopic: async (id: number) => {
    const response = await api.delete(`/practice/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to delete topic');
    return await response.json();
  }
};
