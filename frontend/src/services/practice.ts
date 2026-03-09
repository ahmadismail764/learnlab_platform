import { api } from './api';

export const practiceService = {
  // Generate an adaptive session via FSRS
  generateAdaptiveSession: async () => {
    const response = await api.get('/sessions/generate-adaptive/');
    if (!response.ok) throw new Error('Failed to generate adaptive session');
    return await response.json();
  },

  // Create a new practice session record
  createSession: async (data: { session_type: string }) => {
    const response = await api.post('/sessions/', data);
    if (!response.ok) throw new Error('Failed to create session');
    return await response.json();
  },

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
  }
};
