import { api } from './api';

export interface AggregatedMetricsResponse {
  review_count: number;
  active_users: {
    '7_days': number;
    '30_days': number;
  };
  mastery_averages: {
    avg_stability: number | null;
    avg_difficulty: number | null;
  };
  estimated_retention: number;
}

export interface TopicAnalyticsResponse {
  topic_id: number;
  metrics: {
    avg_stability: number | null;
    avg_difficulty: number | null;
    student_count: number;
  };
  distribution: {
    low_stability: number;
    medium_stability: number;
    high_stability: number;
  };
}

async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;
  } catch {
    // Ignore non-JSON responses.
  }
  return fallback;
}

export const analyticsService = {
  getAggregatedMetrics: async () => {
    const response = await api.getFromRoot('/analytics/aggregated/');
    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Failed to fetch aggregated analytics'));
    }
    return await response.json() as AggregatedMetricsResponse;
  },

  getTopicAnalytics: async (topicId: number) => {
    const response = await api.getFromRoot(`/analytics/topic/${topicId}/`);
    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Failed to fetch topic analytics'));
    }
    return await response.json() as TopicAnalyticsResponse;
  },
};
