import { api } from './api';

export interface BackendQuestion {
  id: number;
  knowledge_point: number | null;
  topic_name: string;
  text: string;
  choices: string[];
  correct_answer_index: number;
  tier: number;
  explanation_video_url: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const questionsService = {
  getQuestions: async (filters: Record<string, string> = {}): Promise<BackendQuestion[]> => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/practice/questions/${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    const data = await response.json();
    // Handle both paginated and unpaginated responses
    return Array.isArray(data) ? data : (data as PaginatedResponse<BackendQuestion>).results ?? [];
  },

  getQuestion: async (id: number): Promise<BackendQuestion> => {
    const response = await api.get(`/practice/questions/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch question');
    return await response.json();
  },

  // Note: The backend QuestionViewSet is ReadOnlyModelViewSet.
  // These methods will return 405 Method Not Allowed until the backend
  // upgrades to a full ModelViewSet for questions.
  createQuestion: async (data: unknown) => {
    const response = await api.post('/practice/questions/', data);
    if (!response.ok) throw new Error('Failed to create question');
    return await response.json();
  },

  updateQuestion: async (id: number, data: unknown) => {
    const response = await api.put(`/practice/questions/${id}/`, data);
    if (!response.ok) throw new Error('Failed to update question');
    return await response.json();
  },

  deleteQuestion: async (id: number) => {
    const response = await api.delete(`/practice/questions/${id}/`);
    if (!response.ok) throw new Error('Failed to delete question');
    if (response.status === 204) return null;
    return await response.json();
  }
};
