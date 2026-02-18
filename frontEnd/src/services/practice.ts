import { api } from './api';

export const practiceService = {
  generateSheet: async () => {
    const response = await api.post('/practice-sheets/', {});
    if (!response.ok) throw new Error('Failed to generate sheet');
    return await response.json();
  },

  submitSheet: async (data: any) => {
    const response = await api.post('/submissions/', data);
    if (!response.ok) throw new Error('Failed to submit sheet');
    return await response.json();
  },

  getSubmissionHistory: async () => {
    const response = await api.get('/submissions/');
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  }
};
