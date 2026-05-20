import { api, type EntityId } from './api';

export interface BackendQuestion {
  id: EntityId;
  subtopic?: EntityId | null;
  subtopic_name?: string | null;
  knowledge_point?: EntityId | null;
  topic_name: string;
  text: string;
  choices: string[];
  correct_answer_index: number;
  tier: number;
  explanation_video_url?: string | null;
}

export interface QuestionMutationPayload {
  text: string;
  choices: string[];
  correct_answer_index: number;
  tier: number;
  subtopic?: EntityId | null;
  explanation_video_url?: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function normalizeQuestion(raw: Partial<BackendQuestion>): BackendQuestion {
  const choices = Array.isArray(raw.choices)
    ? raw.choices.map(String)
    : [];

  return {
    id: raw.id ?? '',
    subtopic: raw.subtopic ?? null,
    subtopic_name: raw.subtopic_name ?? null,
    topic_name: raw.topic_name ?? raw.subtopic_name ?? 'Unlinked',
    text: raw.text ?? '',
    choices,
    correct_answer_index: Number(raw.correct_answer_index ?? 0),
    tier: Number(raw.tier ?? 1),
  };
}

function toQuestionList(data: BackendQuestion[] | PaginatedResponse<BackendQuestion>) {
  const rows = Array.isArray(data) ? data : data.results ?? [];
  return rows.map(normalizeQuestion);
}

export const questionsService = {
  supportsWrites: false,
  getQuestions: async (filters: Record<string, string> = {}): Promise<BackendQuestion[]> => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/practice/questions/${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    const data = await response.json();
    return toQuestionList(data as BackendQuestion[] | PaginatedResponse<BackendQuestion>);
  },

  getQuestion: async (id: EntityId): Promise<BackendQuestion> => {
    const list = await questionsService.getQuestions();
    const match = list.find((item) => String(item.id) === String(id));
    if (!match) throw new Error('Question not found');
    return match;
  },

  createQuestion: async (data: QuestionMutationPayload) => {
    void data;
    throw new Error('Question write endpoints are not available on this backend.');
  },

  updateQuestion: async (id: EntityId, data: QuestionMutationPayload) => {
    void id;
    void data;
    throw new Error('Question write endpoints are not available on this backend.');
  },

  deleteQuestion: async (id: EntityId) => {
    void id;
    throw new Error('Question write endpoints are not available on this backend.');
  }
};
