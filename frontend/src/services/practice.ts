import { api, type EntityId } from "./api";
import { questionsService } from "./questions";

interface SessionCreatePayload {
  session_type?: string;
  interactions?: InteractionCreatePayload[];
  responses?: InteractionCreatePayload[];
}

interface InteractionCreatePayload {
  question?: EntityId;
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
  session: EntityId;
  question: EntityId;
  is_correct: boolean;
  user_response?: string;
  time_taken_seconds?: number;
  confidence_rating?: number;
}

function isEndpointMissing(response: Response): boolean {
  return response.status === 404 || response.status === 405;
}

function isLocalSession(sessionId: EntityId): boolean {
  return String(sessionId).startsWith('local-session-');
}

function localSession() {
  return {
    id: `local-session-${Date.now()}`,
    session_type: 'adaptive',
    start_time: new Date().toISOString(),
    end_time: null,
    total_xp_earned: 0,
    responses: [],
    is_local_fallback: true,
  };
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
    return await response.json();
  },

  getSession: async (id: EntityId) => {
    const response = await api.get(`/practice/sessions/${id}/`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return await response.json();
  },

  createSession: async (data: SessionCreatePayload) => {
    const payloads = [
      data,
      { responses: data.responses ?? data.interactions ?? [] },
      {},
    ];

    for (const payload of payloads) {
      const response = await api.post("/practice/sessions/", payload);
      if (response.ok) return await response.json();
      if (isEndpointMissing(response)) return localSession();
      if (response.status !== 400) break;
    }

    throw new Error("Failed to create session");
  },

  updateSession: async (id: EntityId, data: SessionUpdatePayload) => {
    if (isLocalSession(id)) {
      return { ...localSession(), id, ...data };
    }

    const response = await api.patch(`/practice/sessions/${id}/`, data);
    if (isEndpointMissing(response)) return { ...localSession(), id, ...data };
    if (!response.ok) throw new Error("Failed to update session");
    return await response.json();
  },

  generateAdaptiveSession: async () => {
    const response = await api.get('/practice/sessions/generate-adaptive/');
    if (isEndpointMissing(response)) {
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

  submitInteraction: async (data: InteractionSubmitPayload) => {
    if (isLocalSession(data.session)) {
      return { id: `local-interaction-${Date.now()}`, ...data };
    }

    const payloads = [
      data,
      {
        session_id: data.session,
        question_id: data.question,
        user_response: data.user_response,
        is_correct: data.is_correct,
        time_taken_seconds: data.time_taken_seconds,
        confidence_rating: data.confidence_rating,
      },
      {
        session: data.session,
        question: data.question,
        is_correct: data.is_correct,
      },
    ];
    const paths = ['/practice/interactions/', '/practice/responses/'];

    for (const path of paths) {
      for (const payload of payloads) {
        const response = await api.post(path, payload);
        if (response.ok) return await parseOptionalJson(response);
        if (!isEndpointMissing(response) && response.status !== 400) {
          throw new Error('Failed to submit interaction');
        }
      }
    }

    return { id: `local-interaction-${Date.now()}`, ...data, is_local_fallback: true };
  },

  completeSession: async (sessionId: EntityId, earnedXp: number) => {
    if (isLocalSession(sessionId)) {
      return {
        id: sessionId,
        end_time: new Date().toISOString(),
        total_xp_earned: earnedXp,
        is_local_fallback: true,
      };
    }

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
