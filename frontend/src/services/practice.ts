import { api, type EntityId } from "./api";
import { questionsService } from "./questions";

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
    if (isEndpointMissing(response)) return { id, ...data };
    if (!response.ok) throw new Error("Failed to update session");
    return await response.json();
  },

  generateAdaptiveSession: async () => {
    const response = await api.get('/practice/sessions/generate-adaptive/');
    if (isEndpointMissing(response)) {
      // Adaptive generation endpoint may not exist — build local queue from question bank.
      const questions = await questionsService.getQuestions();
      return {
        questions: questions.slice(0, 10),
        message: questions.length
          ? 'Generated a local practice queue from the question bank.'
          : 'No questions are available yet.',
        is_local_fallback: true,
      };
    }
    if (!response.ok) throw new Error('Failed to generate adaptive session');
    return await response.json();
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
    // Try the responses endpoint with the standard payload
    const response = await api.post('/practice/responses/', {
      session: data.session,
      question: data.question,
      is_correct: data.is_correct,
      time_taken_seconds: data.time_taken_seconds,
      confidence_rating: data.confidence_rating,
    });
    if (response.ok) return await parseOptionalJson(response);
    if (isEndpointMissing(response)) {
      // Interactions might be submitted via session creation instead
      return { id: `fallback-${Date.now()}`, ...data };
    }
    throw new Error('Failed to submit interaction');
  },

  completeSession: async (sessionId: EntityId, earnedXp: number) => {
    const response = await api.patch(`/practice/sessions/${sessionId}/`, {
      end_time: new Date().toISOString(),
      total_xp_earned: earnedXp,
    });
    if (isEndpointMissing(response)) {
      return {
        id: sessionId,
        end_time: new Date().toISOString(),
        total_xp_earned: earnedXp,
        is_local_fallback: true,
      };
    }
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
  },
};
