import { api, type EntityId } from "./api";
import { parseApiError } from "./api";

interface SessionCreatePayload {
  responses?: ResponsePayload[];
}

interface ResponsePayload {
  question?: EntityId;
  selected_answer_index?: number;
}

interface SessionUpdatePayload {
  end_time?: string;
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
    const session = await response.json();
    if (!session?.id) {
      throw new Error("Practice session response is missing an id");
    }
    return session;
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

    const { message } = await parseApiError(response, 'Failed to generate adaptive session');
    throw new Error(message);
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
    selected_answer_index: number;
  }) => {
    const response = await api.post(`/practice/sessions/${data.session}/responses/`, {
      question: data.question,
      selected_answer_index: data.selected_answer_index,
    });
    if (!response.ok) throw new Error('Failed to submit interaction');
    return await parseOptionalJson(response);
  },

  completeSession: async (sessionId: EntityId) => {
    const response = await api.patch(`/practice/sessions/${sessionId}/`, {
      end_time: new Date().toISOString(),
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
  },
};
