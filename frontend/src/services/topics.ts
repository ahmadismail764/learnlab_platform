import { api, type EntityId } from './api';
import { getTopicCategoryName } from '@/utils/topicLabels';

interface TopicPayload {
  name: string;
  description: string;
  question_count?: number;
}

/**
 * A unit of learner mastery.
 *
 * Taxonomy mapping (DB → UI): backend `Topic` = UI **category**, backend
 * `Subtopic` = UI **topic**, backend `Question` = UI question. The backend
 * `/mastery/` endpoint returns one row per *subtopic*, so each row is a UI
 * "topic". `topic`/`topic_name` carry the parent backend topic (the UI
 * category); `subtopic`/`subtopic_name` are this row's UI-topic identity.
 */
export interface TopicMastery {
  /** UI-topic id (the backend subtopic id). */
  id: EntityId;
  /** Backend subtopic id (= UI topic). */
  subtopic: EntityId;
  /** UI-topic display name (backend subtopic name). */
  subtopic_name: string;
  /** Backend topic id (= UI category). */
  topic: EntityId;
  /** UI-category display name (backend topic name). */
  topic_name: string;
  rep_num: number;
  memory: number;
  speed: number;
  difficulty: number;
  status: 'new' | 'learning' | 'learned' | 'struggling';
  last_reviewed: string | null;
  next_due: string | null;
}

interface BackendTopicMastery {
  id?: EntityId;
  topic?: EntityId;
  topic_name?: string;
  subtopic?: EntityId;
  subtopic_name?: string;
  reps?: number | string | null;
  rep_num?: number | string | null;
  memory?: number | string | null;
  stability?: number | string | null;
  speed?: number | string | null;
  difficulty?: number | string | null;
  status?: TopicMastery['status'] | null;
  last_review?: string | null;
  last_reviewed?: string | null;
  next_review?: string | null;
  next_due?: string | null;
}

/**
 * One row per backend subtopic (UI topic) — no longer collapsed to the parent
 * topic, since the backend now exposes subtopic id/name on every mastery row.
 */
function normalizeTopicMasteries(rows: BackendTopicMastery[]): TopicMastery[] {
  return rows.map((row) => {
    const subtopicId = String(row.subtopic ?? row.id ?? '');
    return {
      id: subtopicId,
      subtopic: subtopicId,
      subtopic_name: row.subtopic_name ?? '',
      topic: String(row.topic ?? ''),
      topic_name: row.topic_name ?? '',
      rep_num: Number(row.reps ?? row.rep_num ?? 0),
      memory: Number(Number(row.memory ?? 0).toFixed(4)),
      speed: Number(Number(row.stability ?? row.speed ?? 0).toFixed(4)),
      difficulty: Number(Number(row.difficulty ?? 0).toFixed(4)),
      status: row.status ?? 'new',
      last_reviewed: row.last_review ?? row.last_reviewed ?? null,
      next_due: row.next_review ?? row.next_due ?? null,
    };
  });
}

interface BackendTopic {
  id: EntityId;
  name: string;
  description: string;
  category?: string;
  question_count?: number;
}

export interface BackendSubtopic {
  id: EntityId;
  topic: EntityId;
  topic_name: string;
  name: string;
  description: string;
  question_count: number;
}

function normalizeTopic(raw: Partial<BackendTopic>): BackendTopic {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    category: raw.category ?? getTopicCategoryName(raw.name),
    question_count: Number(raw.question_count ?? 0),
  };
}

function normalizeSubtopic(raw: Partial<BackendSubtopic>): BackendSubtopic {
  return {
    id: raw.id ?? '',
    topic: raw.topic ?? '',
    topic_name: raw.topic_name ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
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
      throw new Error(`Failed to fetch topic mastery (${response.status})`);
    }
    const data = await response.json() as BackendTopicMastery[] | { results?: BackendTopicMastery[] };
    const results = Array.isArray(data) ? data : data.results ?? [];
    return normalizeTopicMasteries(results);
  },

  getTopicDetails: async (id: EntityId) => {
    const response = await api.get(`/topics/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch topic details');
    return normalizeTopic(await response.json() as BackendTopic);
  },

  getSubtopics: async (): Promise<BackendSubtopic[]> => {
    const response = await api.get('/subtopics/');
    if (!response.ok) throw new Error('Failed to fetch subtopics');
    const data = await response.json() as BackendSubtopic[] | { results?: BackendSubtopic[] };
    const results = Array.isArray(data) ? data : data.results ?? [];
    return results.map(normalizeSubtopic);
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
