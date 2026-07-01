import { api, throwApiError, type EntityId } from './api';

/**
 * Subtopic enrollment (UI: "topic" enrollment).
 *
 * Existence-based: a learner is enrolled in a subtopic iff a `SubtopicMastery`
 * row exists. Enroll = create the row; unenroll = delete it (which discards the
 * subtopic's FSRS history). Enrolled subtopics are the only ones that surface
 * questions and can start `?subtopic=` practice sessions.
 *
 * Contract: docs/enrollment_api_contract.md (temporary) / OpenAPI `/schema/`.
 */
export interface Enrollment {
  /** SubtopicMastery id — use this for unenroll (DELETE). */
  id: EntityId;
  /** Enrolled subtopic (UI topic). */
  subtopic: EntityId;
  subtopic_name: string;
  /** Parent topic (UI category), denormalized for list rendering. */
  topic: EntityId;
  topic_name: string;
  mastery_state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
  next_review: string | null;
}

function normalizeEnrollment(raw: Partial<Enrollment>): Enrollment {
  return {
    id: raw.id ?? '',
    subtopic: raw.subtopic ?? '',
    subtopic_name: raw.subtopic_name ?? '',
    topic: raw.topic ?? '',
    topic_name: raw.topic_name ?? '',
    mastery_state: raw.mastery_state ?? 'NEW',
    next_review: raw.next_review ?? null,
  };
}

export const enrollmentsService = {
  list: async (): Promise<Enrollment[]> => {
    const response = await api.get('/enrollments/');
    if (!response.ok) throw new Error('Failed to fetch enrollments');
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.results ?? [];
    return rows.map(normalizeEnrollment);
  },

  /**
   * Enroll in a subtopic. Idempotent — the backend returns 200 (already
   * enrolled, FSRS history untouched) or 201 (new); both are success and return
   * the enrollment object.
   */
  enroll: async (subtopicId: EntityId): Promise<Enrollment> => {
    const response = await api.post('/enrollments/', { subtopic: subtopicId });
    if (!response.ok) {
      await throwApiError(response, 'Failed to enroll in this topic');
    }
    return normalizeEnrollment(await response.json() as Partial<Enrollment>);
  },

  /**
   * Unenroll by enrollment (SubtopicMastery) id. This DISCARDS the subtopic's
   * FSRS history — re-enrolling later starts fresh from NEW.
   */
  unenroll: async (id: EntityId): Promise<void> => {
    const response = await api.delete(`/enrollments/${id}/`);
    if (!response.ok && response.status !== 204) {
      await throwApiError(response, 'Failed to remove this topic');
    }
  },
};
