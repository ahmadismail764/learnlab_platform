import { api } from './api';

export const practiceService = {
<<<<<<< HEAD
  getSessions: async () => {
    const response = await api.get('/sessions/');
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return await response.json();
  },

  getSession: async (id: number) => {
    const response = await api.get(`/sessions/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch session');
    return await response.json();
  },

  createSession: async (data: any) => {
=======
  // Generate an adaptive session via FSRS
  generateAdaptiveSession: async () => {
    const response = await api.get('/sessions/generate-adaptive/');
    if (!response.ok) throw new Error('Failed to generate adaptive session');
    return await response.json();
  },

  // Create a new practice session record
  createSession: async (data: { session_type: string }) => {
>>>>>>> backend-updates
    const response = await api.post('/sessions/', data);
    if (!response.ok) throw new Error('Failed to create session');
    return await response.json();
  },

<<<<<<< HEAD
  updateSession: async (id: number, data: any) => {
    const response = await api.patch(`/sessions/${id}/`, data);
    if (!response.ok) throw new Error('Failed to update session');
    return await response.json();
  },

  // Backward-compatibility aliases
  generateSheet: async () => {
    return practiceService.createSession({});
  },

  submitSheet: async (sessionId: number, data: any) => {
    return practiceService.updateSession(sessionId, data);
  },

  getSubmissionHistory: async () => {
    return practiceService.getSessions();
=======
  // Submit an interaction (single question answer)
  submitInteraction: async (data: {
    session: number;
    question: number;
    user_response: string;
    is_correct: boolean;
    time_taken_seconds: number;
    confidence_rating: number;
  }) => {
    const response = await api.post('/interactions/', data);
    // Note: The backend automatically updates TopicMastery via signals/perform_create
    if (!response.ok) throw new Error('Failed to submit interaction');
    return await response.json();
  },

  // Complete the session
  completeSession: async (sessionId: number, earnedXp: number) => {
    const response = await api.patch(`/sessions/${sessionId}/complete_session/`, {
      total_xp_earned: earnedXp
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
>>>>>>> backend-updates
  }
};
