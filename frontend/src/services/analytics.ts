import { api, throwApiError } from './api';

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
  getAggregatedMetrics: async (): Promise<AggregatedMetricsResponse> => {
    const response = await api.get('/analytics/aggregated/');
    if (!response.ok) {
      throw new Error(`Failed to fetch aggregated analytics (${response.status})`);
    }
    return await response.json() as AggregatedMetricsResponse;
  },

  getTopicAnalytics: async (topicId: number | string): Promise<TopicAnalyticsResponse> => {
    const response = await api.get(`/analytics/topics/${topicId}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch topic analytics (${response.status})`);
    }
    return await response.json() as TopicAnalyticsResponse;
  },

  getBulkTopicAnalytics: async (): Promise<BulkTopicAnalyticsResponse> => {
    const response = await api.get('/analytics/topics/');
    if (!response.ok) {
      throw new Error(`Failed to fetch bulk topic analytics (${response.status})`);
    }
    return await response.json() as BulkTopicAnalyticsResponse;
  },

  getActivityTimeSeries: async (period?: string): Promise<ActivityTimeSeriesResponse> => {
    const query = period ? `?period=${period}` : '';
    const response = await api.get(`/analytics/activity/${query}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch activity time-series (${response.status})`);
    }
    return await response.json() as ActivityTimeSeriesResponse;
  },

  getDifficultyBreakdown: async (): Promise<DifficultyTierBreakdownResponse> => {
    const response = await api.get('/analytics/difficulty/');
    if (!response.ok) {
      throw new Error(`Failed to fetch difficulty breakdown (${response.status})`);
    }
    return await response.json() as DifficultyTierBreakdownResponse;
  },
};
