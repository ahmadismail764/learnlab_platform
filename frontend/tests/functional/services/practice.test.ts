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

  it('does not fall back to the generic question bank when adaptive generation fails', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(practiceService.generateAdaptiveSession()).rejects.toThrow(
      'Failed to generate adaptive session',
    );

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/practice/sessions/generate-adaptive/');
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

  it('submits rich live response telemetry to the nested session response endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'response-1' }),
    } as unknown as Response);

    await practiceService.submitInteraction({
      session: 'session-1',
      question: 'question-1',
      is_correct: true,
      time_taken_seconds: 12,
      confidence_rating: 4,
      answer_text: 'A',
    });

    expect(api.post).toHaveBeenCalledWith('/practice/sessions/session-1/responses/', {
      question: 'question-1',
      is_correct: true,
      time_taken_seconds: 12,
      confidence_rating: 4,
      answer_text: 'A',
    });
  });
});
