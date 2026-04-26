import { api } from "./api";

interface SessionCreatePayload {
  session_type: string;
  interactions: InteractionCreatePayload[];
}

interface InteractionCreatePayload {
  question?: number;
  user_response?: string;
  is_correct?: boolean;
  time_taken_seconds?: number;
  confidence_rating?: number;
}

interface SessionUpdatePayload {
  end_time?: string;
  total_xp_earned?: number;
}

interface InteractionSubmitPayload {
  session: number;
  question: number;
  is_correct: boolean;
  user_response?: string;
  time_taken_seconds?: number;
  confidence_rating?: number;
}

export const practiceService = {
  getSessions: async () => {
    const response = await api.get("/practice/sessions/");
    if (!response.ok) throw new Error("Failed to fetch sessions");
    return await response.json();
  },

  getSession: async (id: number) => {
    const response = await api.get(`/practice/sessions/${id}/`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return await response.json();
  },

  createSession: async (data: SessionCreatePayload) => {
    const response = await api.post("/practice/sessions/", data);
    if (!response.ok) throw new Error("Failed to create session");
    return await response.json();
  },

  updateSession: async (id: number, data: SessionUpdatePayload) => {
    const response = await api.patch(`/practice/sessions/${id}/`, data);
    if (!response.ok) throw new Error("Failed to update session");
    return await response.json();
  },

  generateAdaptiveSession: async () => {
    const response = await api.get('/practice/sessions/generate-adaptive/');
    if (!response.ok) throw new Error('Failed to generate adaptive session');
    return await response.json();
  },

  // Backward-compatibility aliases
  generateSheet: async () => {
    return practiceService.generateAdaptiveSession();
  },

  submitSheet: async (sessionId: number, data: SessionUpdatePayload) => {
    return practiceService.updateSession(sessionId, data);
  },

  getSubmissionHistory: async () => {
    return practiceService.getSessions();
  },

  submitInteraction: async (data: InteractionSubmitPayload) => {
    const response = await api.post('/practice/interactions/', {
      session_id: data.session,
      question_id: data.question,
      is_correct: data.is_correct,
    });
    if (!response.ok) throw new Error('Failed to submit interaction');
    return await response.json();
  },

  completeSession: async (sessionId: number, earnedXp: number) => {
    const response = await api.patch(`/practice/sessions/${sessionId}/`, {
      end_time: new Date().toISOString(),
      total_xp_earned: earnedXp,
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
  },
};
