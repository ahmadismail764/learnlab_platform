import { api, type EntityId } from './api';
import { getTopicCategoryName } from '@/utils/topicLabels';

interface TopicPayload {
  name: string;
  description: string;
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

type MasteryStatus = TopicMastery['status'];

interface TopicMasteryAccumulator extends TopicMastery {
  _count: number;
}

const STATUS_PRIORITY: Record<MasteryStatus, number> = {
  struggling: 0,
  learning: 1,
  new: 2,
  learned: 3,
};

function latestDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function earliestDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function mergeTopicMastery(current: TopicMasteryAccumulator, next: TopicMastery): TopicMasteryAccumulator {
  const count = current._count + 1;
  const status =
    STATUS_PRIORITY[next.status] < STATUS_PRIORITY[current.status]
      ? next.status
      : current.status;

  return {
    ...current,
    rep_num: current.rep_num + next.rep_num,
    memory: (current.memory * current._count + next.memory) / count,
    speed: (current.speed * current._count + next.speed) / count,
    difficulty: (current.difficulty * current._count + next.difficulty) / count,
    status,
    last_reviewed: latestDate(current.last_reviewed, next.last_reviewed),
    next_due: earliestDate(current.next_due, next.next_due),
    _count: count,
  };
}

function normalizeTopicMasteries(rows: TopicMastery[]): TopicMastery[] {
  const grouped = new Map<string, TopicMasteryAccumulator>();

  for (const row of rows) {
    const topicKey = String(row.topic || row.id);
    const normalized: TopicMastery = {
      ...row,
      id: topicKey,
      topic: topicKey,
      rep_num: Number(row.rep_num ?? 0),
      memory: Number(row.memory ?? 0),
      speed: Number(row.speed ?? 0),
      difficulty: Number(row.difficulty ?? 0),
      status: row.status ?? 'new',
      last_reviewed: row.last_reviewed ?? null,
      next_due: row.next_due ?? null,
    };

    const current = grouped.get(topicKey);
    grouped.set(
      topicKey,
      current
        ? mergeTopicMastery(current, normalized)
        : { ...normalized, _count: 1 },
    );
  }

  return Array.from(grouped.values()).map((entry) => ({
    id: entry.id,
    topic: entry.topic,
    topic_name: entry.topic_name,
    rep_num: entry.rep_num,
    memory: Number(entry.memory.toFixed(4)),
    speed: Number(entry.speed.toFixed(4)),
    difficulty: Number(entry.difficulty.toFixed(4)),
    status: entry.status,
    last_reviewed: entry.last_reviewed,
    next_due: entry.next_due,
  }));
}

interface BackendTopic {
  id: EntityId;
  name: string;
  description: string;
  category?: string;
  question_count?: number;
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
    const data = await response.json() as TopicMastery[] | { results?: TopicMastery[] };
    const results = Array.isArray(data) ? data : data.results ?? [];
    return normalizeTopicMasteries(results);
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
