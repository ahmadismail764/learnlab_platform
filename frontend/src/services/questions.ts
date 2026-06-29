import { api, throwApiError, type EntityId } from './api';

/** How the learner answers a question. Matches backend Question.QuestionType. */
export type QuestionType = 'MCQ' | 'WRITTEN';
/** How the answer is graded. Matches backend Question.GradingMethod. */
export type GradingMethod = 'EXACT_INDEX' | 'CAS' | 'LLM';

export interface BackendQuestion {
  id: EntityId;
  subtopic?: EntityId | null;
  subtopic_name?: string | null;
  topic_name: string;
  text: string;
  question_type: QuestionType;
  grading_method: GradingMethod;
  choices: string[];
  correct_answer_index: number | null;
  /** Canonical answer for written questions (admin-only; blank for MCQ). */
  correct_answer: string;
  tier: number;
  tier_display?: string | null;
}

/**
 * Question authoring payload. MCQ carries choices + correct_answer_index;
 * WRITTEN carries correct_answer (plain ASCII math). The backend validates that
 * the answer key matches the type and defaults WRITTEN → CAS grading.
 */
export interface QuestionMutationPayload {
  text: string;
  tier: number;
  subtopic?: EntityId | null;
  question_type: QuestionType;
  choices?: string[];
  correct_answer_index?: number | null;
  correct_answer?: string;
  grading_method?: GradingMethod;
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
    question_type: raw.question_type === 'WRITTEN' ? 'WRITTEN' : 'MCQ',
    grading_method: raw.grading_method ?? 'EXACT_INDEX',
    choices,
    correct_answer_index: typeof raw.correct_answer_index === 'number' ? raw.correct_answer_index : null,
    correct_answer: raw.correct_answer ?? '',
    tier: Number(raw.tier ?? 1),
    tier_display: raw.tier_display ?? null,
  };
}

function toQuestionList(data: BackendQuestion[] | PaginatedResponse<BackendQuestion>) {
  const rows = Array.isArray(data) ? data : data.results ?? [];
  return rows.map(normalizeQuestion);
}

function toBackendMutationPayload(data: QuestionMutationPayload): Record<string, unknown> {
  const base = {
    text: data.text,
    tier: data.tier,
    subtopic: data.subtopic ?? null,
    question_type: data.question_type,
  };

  if (data.question_type === 'WRITTEN') {
    return {
      ...base,
      // Written questions are graded by the CAS engine; choices stay empty.
      choices: [],
      correct_answer: data.correct_answer ?? '',
      grading_method: data.grading_method ?? 'CAS',
    };
  }

  return {
    ...base,
    choices: data.choices ?? [],
    correct_answer_index: data.correct_answer_index ?? null,
    grading_method: 'EXACT_INDEX',
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
