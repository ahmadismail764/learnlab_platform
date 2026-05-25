import { api, type EntityId } from './api';

interface TopicPayload {
  name: string;
  description: string;
  parent_module?: string;
  question_count?: number;
}

export interface TopicMastery {
  id: EntityId;
  topic: EntityId;
  topic_name: string;
  rep_num: number;
  memory: number;
  speed: number;
  difficulty: number;
  status: 'new' | 'learning' | 'learned' | 'struggling';
  last_reviewed: string | null;
  next_due: string | null;
}


interface BackendTopic {
  id: EntityId;
  name: string;
  description: string;
  parent_module?: string;
  question_count?: number;
}

function normalizeTopic(raw: Partial<BackendTopic>): BackendTopic {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    parent_module: raw.parent_module ?? '',
    question_count: Number(raw.question_count ?? 0),
  };
}

export const topicsService = {
  getTopics: async () => {
    const response = await api.get('/topics/');
    if (!response.ok) throw new Error('Failed to fetch topics');
    const data = await response.json() as BackendTopic[] | { results?: BackendTopic[] };
    const results = Array.isArray(data) ? data : data.results ?? [];
    return results.map(normalizeTopic);
  },

  getTopicMastery: async (filters: Record<string, string> = {}): Promise<TopicMastery[]> => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/mastery/${query ? `?${query}` : ''}`);
    if (!response.ok) {
      // Mastery endpoint may return errors for users with no data — return empty gracefully.
      console.warn('Topic mastery fetch returned non-OK status:', response.status);
      return [];
    }
    const data = await response.json() as TopicMastery[] | { results?: TopicMastery[] };
    const results = Array.isArray(data) ? data : data.results ?? [];
    return results;
  },

  getTopicDetails: async (id: EntityId) => {
    const response = await api.get(`/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch topic details');
    return normalizeTopic(await response.json() as BackendTopic);
  },

  createTopic: async (data: TopicPayload) => {
    const response = await api.post('/topics/', {
      name: data.name,
      description: data.description,
    });
    if (!response.ok) throw new Error('Failed to create topic');
    return normalizeTopic(await response.json() as BackendTopic);
  },

  updateTopic: async (id: EntityId, data: Partial<TopicPayload>) => {
    const response = await api.put(`/topics/${id}/`, {
      name: data.name,
      description: data.description,
    });
    if (!response.ok) throw new Error('Failed to update topic');
    return normalizeTopic(await response.json() as BackendTopic);
  },

  deleteTopic: async (id: EntityId) => {
    const response = await api.delete(`/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to delete topic');
    if (response.status === 204) return null;
    return await response.json();
  }
};
