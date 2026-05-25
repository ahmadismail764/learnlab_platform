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
    estimated_retention?: number;
  };
  distribution: {
    low_speed: number;
    medium_speed: number;
    high_speed: number;
  };
}

export interface BulkTopicAnalyticsResponse {
  results: {
    topic_id: number | string;
    topic_name: string;
    metrics: {
      avg_speed: number | null;
      avg_difficulty: number | null;
      estimated_retention: number;
      learner_count: number;
    };
    distribution: {
      low_speed: number;
      medium_speed: number;
      high_speed: number;
    };
  }[];
}

export interface ActivityTimeSeriesResponse {
  bucket: string;
  results: {
    date: string;
    active_learners: number;
    questions_answered: number;
  }[];
}

export interface DifficultyTierBreakdownResponse {
  tiers: Record<string, {
    attempts: number;
    accuracy: number;
  }>;
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

  getBulkTopicAnalytics: async (): Promise<BulkTopicAnalyticsResponse | null> => {
    try {
      const response = await api.get('/analytics/topics/');
      if (!response.ok) {
        console.warn('Bulk topic analytics returned status:', response.status);
        return null;
      }
      return await response.json() as BulkTopicAnalyticsResponse;
    } catch (error) {
      console.warn('Bulk topic analytics fetch error:', error);
      return null;
    }
  },

  getActivityTimeSeries: async (period?: string): Promise<ActivityTimeSeriesResponse | null> => {
    try {
      const query = period ? `?period=${period}` : '';
      const response = await api.get(`/analytics/activity/${query}`);
      if (!response.ok) {
        console.warn('Activity time-series returned status:', response.status);
        return null;
      }
      return await response.json() as ActivityTimeSeriesResponse;
    } catch (error) {
      console.warn('Activity time-series fetch error:', error);
      return null;
    }
  },

  getDifficultyBreakdown: async (): Promise<DifficultyTierBreakdownResponse | null> => {
    try {
      const response = await api.get('/analytics/difficulty/');
      if (!response.ok) {
        console.warn('Difficulty breakdown returned status:', response.status);
        return null;
      }
      return await response.json() as DifficultyTierBreakdownResponse;
    } catch (error) {
      console.warn('Difficulty breakdown fetch error:', error);
      return null;
    }
  },
};
