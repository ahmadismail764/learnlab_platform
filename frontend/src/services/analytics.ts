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
  topic_id: number;
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
    console.warn('Analytics endpoints are not available on this backend.');
    return null;
  },

  getTopicAnalytics: async (topicId: number): Promise<TopicAnalyticsResponse | null> => {
    void topicId;
    console.warn('Analytics endpoints are not available on this backend.');
    return null;
  },
};
