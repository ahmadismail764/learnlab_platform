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
};
