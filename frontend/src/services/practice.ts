import { api } from "./api";

export const practiceService = {
  getSessions: async () => {
    const response = await api.get("/sessions/");
    if (!response.ok) throw new Error("Failed to fetch sessions");
    return await response.json();
  },

  getSession: async (id: number) => {
    const response = await api.get(`/sessions/${id}/`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return await response.json();
  },

  createSession: async (data: any) => {
    const response = await api.post("/sessions/", data);
    if (!response.ok) throw new Error("Failed to create session");
    return await response.json();
  },

  updateSession: async (id: number, data: any) => {
    const response = await api.patch(`/sessions/${id}/`, data);
    if (!response.ok) throw new Error("Failed to update session");
    return await response.json();
  },

  generateAdaptiveSession: async () => {
    const response = await api.get('/sessions/generate-adaptive/');
    if (!response.ok) throw new Error('Failed to generate adaptive session');
    return await response.json();
  },

  // Backward-compatibility aliases
  generateSheet: async () => {
    return practiceService.generateAdaptiveSession();
  },

  submitSheet: async (sessionId: number, data: any) => {
    return practiceService.updateSession(sessionId, data);
  },

  getSubmissionHistory: async () => {
    return practiceService.getSessions();
  },

  submitInteraction: async (data: {
    session: number;
    question: number;
    is_correct: boolean;
    user_response?: string;
    time_taken_seconds?: number;
    confidence_rating?: number;
  }) => {
    const response = await api.post('/interactions/', {
      session_id: data.session,
      question_id: data.question,
      is_correct: data.is_correct,
    });
    if (!response.ok) throw new Error('Failed to submit interaction');
    return await response.json();
  },

  completeSession: async (sessionId: number, earnedXp: number) => {
    const response = await api.patch(`/sessions/${sessionId}/`, {
      end_time: new Date().toISOString(),
      total_xp_earned: earnedXp,
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
  },
};
