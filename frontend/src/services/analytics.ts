import { api } from './api';

export interface AggregatedMetricsResponse {
  review_count: number;
  active_users: {
    '7_days': number;
    '30_days': number;
  };
  mastery_averages: {
    avg_speed: number | null;
    avg_difficulty: number | null;
  };
  estimated_retention: number;
}

export interface TopicAnalyticsResponse {
  topic_id: number | string;
  metrics: {
    avg_speed: number | null;
    avg_difficulty: number | null;
    learner_count: number;
  };
  distribution: {
    low_speed: number;
    medium_speed: number;
    high_speed: number;
  };
}

export const analyticsService = {
  getAggregatedMetrics: async (): Promise<AggregatedMetricsResponse | null> => {
    try {
      const response = await api.get('/analytics/aggregated/');
      if (!response.ok) {
        console.warn('Analytics aggregated returned status:', response.status);
        return null;
      }
      return await response.json() as AggregatedMetricsResponse;
    } catch (error) {
      console.warn('Analytics aggregated fetch error:', error);
      return null;
    }
  },

  getTopicAnalytics: async (topicId: number | string): Promise<TopicAnalyticsResponse | null> => {
    try {
      const response = await api.get(`/analytics/topics/${topicId}/`);
      if (!response.ok) {
        console.warn('Topic analytics returned status:', response.status);
        return null;
      }
      return await response.json() as TopicAnalyticsResponse;
    } catch (error) {
      console.warn('Topic analytics fetch error:', error);
      return null;
    }
  },
};
