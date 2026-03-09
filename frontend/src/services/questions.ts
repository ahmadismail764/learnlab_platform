import { api } from './api';

export const questionsService = {
  getQuestions: async (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/questions/?${query}`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return await response.json();
  },

  getQuestion: async (id: number) => {
    const response = await api.get(`/questions/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch question');
    return await response.json();
  },

  createQuestion: async (data: any) => {
    const response = await api.post('/questions/', data);
    if (!response.ok) throw new Error('Failed to create question');
    return await response.json();
  },

  updateQuestion: async (id: number, data: any) => {
    const response = await api.put(`/questions/${id}/`, data);
    if (!response.ok) throw new Error('Failed to update question');
    return await response.json();
  },

  deleteQuestion: async (id: number) => {
    const response = await api.delete(`/questions/${id}/`);
    if (!response.ok) throw new Error('Failed to delete question');
    return await response.json();
  }
};
