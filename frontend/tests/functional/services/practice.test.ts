import { beforeEach, describe, expect, it, vi } from 'vitest';
import { practiceService } from '@/services/practice';
import { api } from '@/services/api';

vi.mock('@/services/api', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
    parseApiError: vi.fn(async (_response: Response, fallback: string) => ({ message: fallback })),
  };
});

describe('practiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces session history failures instead of returning a fake empty list', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(practiceService.getSessions()).rejects.toThrow('Failed to fetch sessions');
  });

  it('surfaces adaptive session creation failures without falling back to another endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(practiceService.generateAdaptiveSession()).rejects.toThrow(
      'Failed to create session',
    );

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/practice/sessions/', {});
  });

  it('creates an adaptive session and loads placeholder question details', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'session-1',
        responses: [{ id: 'response-1', question: 'question-1', is_correct: false }],
      }),
    } as unknown as Response);
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'question-1',
        text: 'What is 2 + 2?',
        choices: ['3', '4'],
        tier: 1,
        subtopic_name: 'Arithmetic',
      }),
    } as unknown as Response);

    const session = await practiceService.generateAdaptiveSession('topic-1');

    expect(api.post).toHaveBeenCalledWith('/practice/sessions/?topic=topic-1', {});
    expect(api.get).toHaveBeenCalledWith('/practice/questions/question-1/');
    expect(session.id).toBe('session-1');
    expect(session.questions).toHaveLength(1);
    expect(session.questions[0].id).toBe('question-1');
  });

  it('creates a session scoped to a subtopic, taking precedence over topic', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'session-2', responses: [] }),
    } as unknown as Response);

    await practiceService.createSession({ topicId: 'topic-1', subtopicId: 'sub-9' });

    expect(api.post).toHaveBeenCalledWith('/practice/sessions/?subtopic=sub-9', {});
  });

  it('requires created practice sessions to include an id', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responses: [] }),
    } as unknown as Response);

    await expect(practiceService.createSession()).rejects.toThrow(
      'Practice session response is missing an id',
    );
  });

  it('submits the selected answer index and confidence rating to the placeholder response endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'response-1', correct_answer_index: 1 }),
    } as unknown as Response);

    await practiceService.submitInteraction({
      session: 'session-1',
      question: 'question-1',
      selected_answer_index: 2,
      confidence_rating: 4,
    });

    expect(api.patch).toHaveBeenCalledWith('/practice/sessions/session-1/responses/question-1/', {
      selected_answer_index: 2,
      confidence_rating: 4,
    });
  });

  it('returns the next-review headline when completing a session', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'session-1',
        next_review: {
          window_days: 7,
          next_review_at: '2026-06-28',
          due_now_count: 1,
          forecast: [{ date: '2026-06-28', due_count: 1, subtopics: [] }],
        },
      }),
    } as unknown as Response);

    const result = await practiceService.completeSession('session-1');

    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(result.next_review?.forecast).toHaveLength(1);
    expect(result.next_review?.next_review_at).toBe('2026-06-28');
  });

  it('fetches the review forecast with a default window', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ window_days: 7, next_review_at: null, due_now_count: 0, forecast: [] }),
    } as unknown as Response);

    const forecast = await practiceService.getReviewForecast();

    expect(api.get).toHaveBeenCalledWith('/practice/review-forecast/');
    expect(forecast.window_days).toBe(7);
  });

  it('passes the selected window to the review forecast endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ window_days: 30, next_review_at: null, due_now_count: 0, forecast: [] }),
    } as unknown as Response);

    await practiceService.getReviewForecast(30);

    expect(api.get).toHaveBeenCalledWith('/practice/review-forecast/?days=30');
  });

  it('surfaces review forecast failures instead of returning empty data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(practiceService.getReviewForecast()).rejects.toThrow(
      'Failed to fetch review forecast',
    );
  });
});
