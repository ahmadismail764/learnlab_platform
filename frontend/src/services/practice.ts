import { api, type EntityId } from "./api";

interface SessionCreatePayload {
  responses?: ResponsePayload[];
}

interface ResponsePayload {
  question?: EntityId;
  is_correct?: boolean;
  time_taken_seconds?: number;
  confidence_rating?: number;
}

interface SessionUpdatePayload {
  end_time?: string;
  total_xp_earned?: number;
}

function isEndpointMissing(response: Response): boolean {
  return response.status === 404 || response.status === 405;
}

async function parseOptionalJson(response: Response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const practiceService = {
  getSessions: async () => {
    const response = await api.get("/practice/sessions/");
    if (isEndpointMissing(response)) return [];
    if (!response.ok) throw new Error("Failed to fetch sessions");
    const data = await response.json();
    return Array.isArray(data) ? data : data.results ?? [];
  },

  getSession: async (id: EntityId) => {
    const response = await api.get(`/practice/sessions/${id}/`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return await response.json();
  },

  createSession: async (data: SessionCreatePayload) => {
    // Backend expects { responses: [...] } per integration guide
    const payload = { responses: data.responses ?? [] };
    const response = await api.post("/practice/sessions/", payload);
    if (!response.ok) throw new Error("Failed to create session");
    return await response.json();
  },

  updateSession: async (id: EntityId, data: SessionUpdatePayload) => {
    const response = await api.patch(`/practice/sessions/${id}/`, data);
    if (!response.ok) throw new Error("Failed to update session");
    return await response.json();
  },

  generateAdaptiveSession: async (topicId?: string) => {
    const url = topicId
      ? `/practice/sessions/generate-adaptive/?topic=${encodeURIComponent(topicId)}`
      : '/practice/sessions/generate-adaptive/';
    const response = await api.get(url);
    if (response.ok) {
      return await response.json();
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Failed to generate adaptive session');
    }

    if (response.status >= 500 || isEndpointMissing(response)) {
      const fallbackResponse = await api.get('/practice/questions/');
      if (!fallbackResponse.ok) {
        throw new Error('Failed to generate adaptive session');
      }
      const data = await fallbackResponse.json();
      const list = Array.isArray(data) ? data : data.results ?? [];
      return {
        questions: list.slice(0, 10),
        message: 'Adaptive session unavailable; showing general practice questions.',
      };
    }

    throw new Error('Failed to generate adaptive session');
  },

  // Backward-compatibility aliases
  generateSheet: async () => {
    return practiceService.generateAdaptiveSession();
  },

  submitSheet: async (sessionId: EntityId, data: SessionUpdatePayload) => {
    return practiceService.updateSession(sessionId, data);
  },

  getSubmissionHistory: async () => {
    return practiceService.getSessions();
  },

  submitInteraction: async (data: {
    session: EntityId;
    question: EntityId;
    is_correct: boolean;
    user_response?: string;
    time_taken_seconds?: number;
    confidence_rating?: number;
  }) => {
    const response = await api.post(`/practice/sessions/${data.session}/responses/`, {
      question: data.question,
      is_correct: data.is_correct,
      time_taken_seconds: data.time_taken_seconds,
      confidence_rating: data.confidence_rating,
    });
    if (!response.ok) throw new Error('Failed to submit interaction');
    return await parseOptionalJson(response);
  },

  completeSession: async (sessionId: EntityId, earnedXp: number) => {
    const response = await api.patch(`/practice/sessions/${sessionId}/`, {
      end_time: new Date().toISOString(),
      total_xp_earned: earnedXp,
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
  },
};
