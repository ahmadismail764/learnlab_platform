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
    expect(api.post).toHaveBeenCalledWith('/practice/sessions/', { responses: [] });
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

    expect(api.post).toHaveBeenCalledWith('/practice/sessions/?topic=topic-1', { responses: [] });
    expect(api.get).toHaveBeenCalledWith('/practice/questions/question-1/');
    expect(session.id).toBe('session-1');
    expect(session.questions).toHaveLength(1);
    expect(session.questions[0].id).toBe('question-1');
  });

  it('requires created practice sessions to include an id', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responses: [] }),
    } as unknown as Response);

    await expect(practiceService.createSession({ responses: [] })).rejects.toThrow(
      'Practice session response is missing an id',
    );
  });

  it('submits the selected answer index to the question placeholder response endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'response-1', correct_answer_index: 1 }),
    } as unknown as Response);

    await practiceService.submitInteraction({
      session: 'session-1',
      question: 'question-1',
      selected_answer_index: 2,
    });

    expect(api.patch).toHaveBeenCalledWith('/practice/sessions/session-1/responses/question-1/', {
      question: 'question-1',
      selected_answer_index: 2,
    });
  });
});
