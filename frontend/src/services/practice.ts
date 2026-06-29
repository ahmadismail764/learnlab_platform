import { api, type EntityId } from "./api";
import { parseApiError } from "./api";
import { questionsService, type BackendQuestion } from "./questions";

interface SessionCreatePayload {
  topicId?: string;
  /** Backend Subtopic id. Takes precedence over topicId when both are set. */
  subtopicId?: string;
}

interface SessionUpdatePayload {
  end_time?: string;
}

interface PracticeSessionResponse {
  id: EntityId;
  question: EntityId;
  is_correct: boolean;
}

interface PracticeSessionRecord {
  id: EntityId;
  responses?: PracticeSessionResponse[];
  message?: string;
}

/** One subtopic due on a given forecast day. Matches the backend ForecastSubtopicSerializer. */
export interface ForecastSubtopic {
  id: EntityId;
  name: string;
  topic_id: EntityId | null;
  topic_name: string | null;
  state: string;
  next_review: string;
}

/** One calendar day in the upcoming-review agenda. */
export interface ReviewForecastDay {
  date: string;
  due_count: number;
  subtopics: ForecastSubtopic[];
}

/**
 * A learner's upcoming FSRS reviews grouped by day.
 * Matches GET /practice/review-forecast/ and the `next_review` block returned
 * when a session is completed.
 */
export interface ReviewForecast {
  window_days: number;
  next_review_at: string | null;
  due_now_count: number;
  forecast: ReviewForecastDay[];
}

/** Session payload returned on completion — includes the next-review headline. */
export interface SessionCompletionResult extends PracticeSessionRecord {
  next_review?: ReviewForecast;
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

  createSession: async (data: SessionCreatePayload = {}): Promise<PracticeSessionRecord> => {
    // Backend gives ?subtopic= precedence over ?topic=, so mirror that here.
    const query = data.subtopicId
      ? `?subtopic=${encodeURIComponent(data.subtopicId)}`
      : data.topicId
        ? `?topic=${encodeURIComponent(data.topicId)}`
        : '';
    const response = await api.post(`/practice/sessions/${query}`, {});
    if (!response.ok) throw new Error("Failed to create session");
    const session = await response.json() as PracticeSessionRecord;
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

  generateAdaptiveSession: async (topicId?: string, subtopicId?: string): Promise<PracticeSessionRecord & { questions: BackendQuestion[] }> => {
    const session = await practiceService.createSession({ topicId, subtopicId });
    const responseRows = session.responses ?? [];

    if (responseRows.length === 0) {
      return { ...session, questions: [] };
    }

    try {
      const questions = await Promise.all(
        responseRows.map((row) => questionsService.getQuestion(row.question)),
      );
      return { ...session, questions };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load session questions';
      throw new Error(message);
    }
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
    confidence_rating?: number;
  }) => {
    const response = await api.patch(`/practice/sessions/${data.session}/responses/${data.question}/`, {
      selected_answer_index: data.selected_answer_index,
      ...(data.confidence_rating ? { confidence_rating: data.confidence_rating } : {}),
    });
    if (!response.ok) {
      const { message } = await parseApiError(response, 'Failed to submit interaction');
      throw new Error(message);
    }
    return await parseOptionalJson(response);
  },

  completeSession: async (sessionId: EntityId): Promise<SessionCompletionResult> => {
    const response = await api.patch(`/practice/sessions/${sessionId}/`, {
      end_time: new Date().toISOString(),
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return await response.json();
  },

  getReviewForecast: async (days?: number): Promise<ReviewForecast> => {
    const query = typeof days === 'number' ? `?days=${days}` : '';
    const response = await api.get(`/practice/review-forecast/${query}`);
    if (!response.ok) throw new Error('Failed to fetch review forecast');
    return await response.json();
  },
};
