import { api } from './api';

export const analyticsService = {
  getAggregatedMetrics: async () => {
    const response = await api.get('/analytics/aggregated/');
    if (!response.ok) throw new Error('Failed to fetch aggregated analytics');
    return await response.json();
  },

  getTopicAnalytics: async (topicId: number) => {
    const response = await api.get(`/analytics/topic/${topicId}/`);
    if (!response.ok) throw new Error('Failed to fetch topic analytics');
    return await response.json();
  },
};
