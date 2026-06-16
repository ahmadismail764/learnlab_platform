import { api, throwApiError, type EntityId } from './api';

export interface BackendQuestion {
  id: EntityId;
  subtopic?: EntityId | null;
  subtopic_name?: string | null;
  topic_name: string;
  text: string;
  choices: string[];
  correct_answer_index: number | null;
  tier: number;
  tier_display?: string | null;
  explanation_video_url?: string | null;
}

export interface QuestionMutationPayload {
  text: string;
  choices: string[];
  correct_answer_index: number;
  tier: number;
  subtopic?: EntityId | null;
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
    topic_name: raw.topic_name ?? raw.subtopic_name ?? '',
    text: raw.text ?? '',
    choices,
    correct_answer_index: typeof raw.correct_answer_index === 'number' ? raw.correct_answer_index : null,
    tier: Number(raw.tier ?? 1),
    tier_display: raw.tier_display ?? null,
  };
}

function toQuestionList(data: BackendQuestion[] | PaginatedResponse<BackendQuestion>) {
  const rows = Array.isArray(data) ? data : data.results ?? [];
  return rows.map(normalizeQuestion);
}

function toBackendMutationPayload(data: QuestionMutationPayload): QuestionMutationPayload {
  return {
    text: data.text,
    choices: data.choices,
    correct_answer_index: data.correct_answer_index,
    tier: data.tier,
    subtopic: data.subtopic ?? null,
  };
}

export const questionsService = {
  supportsWrites: true,

  getQuestions: async (filters: Record<string, string> = {}): Promise<BackendQuestion[]> => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/practice/questions/${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    const data = await response.json();
    return toQuestionList(data as BackendQuestion[] | PaginatedResponse<BackendQuestion>);
  },

  getQuestion: async (id: EntityId): Promise<BackendQuestion> => {
    const response = await api.get(`/practice/questions/${id}/`);
    if (!response.ok) throw new Error('Question not found');
    const data = await response.json();
    return normalizeQuestion(data as Partial<BackendQuestion>);
  },

  createQuestion: async (data: QuestionMutationPayload): Promise<BackendQuestion> => {
    const response = await api.post('/practice/questions/', toBackendMutationPayload(data));
    if (!response.ok) {
      await throwApiError(response, 'Failed to create question');
    }
    const result = await response.json();
    return normalizeQuestion(result as Partial<BackendQuestion>);
  },

  updateQuestion: async (id: EntityId, data: QuestionMutationPayload): Promise<BackendQuestion> => {
    const response = await api.put(`/practice/questions/${id}/`, toBackendMutationPayload(data));
    if (!response.ok) {
      await throwApiError(response, 'Failed to update question');
    }
    const result = await response.json();
    return normalizeQuestion(result as Partial<BackendQuestion>);
  },

  deleteQuestion: async (id: EntityId): Promise<void> => {
    const response = await api.delete(`/practice/questions/${id}/`);
    if (!response.ok) {
      await throwApiError(response, 'Failed to delete question');
    }
  },
};
