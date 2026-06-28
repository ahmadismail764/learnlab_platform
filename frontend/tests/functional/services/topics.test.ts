import { beforeEach, describe, expect, it, vi } from 'vitest';
import { topicsService } from '@/services/topics';
import { api } from '@/services/api';

vi.mock('@/services/api', () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

describe('topicsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTopicMastery', () => {
    it('normalizes the current backend mastery contract for learner views', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'mastery-1',
            topic: 'topic-1',
            topic_name: 'Seeded Discrete Mathematics',
            reps: 3,
            memory: 0.82,
            stability: 6.5,
            difficulty: 4.2,
            status: 'learned',
            last_review: '2026-06-24T10:00:00Z',
            next_review: '2026-06-29T10:00:00Z',
          },
        ],
      } as unknown as Response);

      const masteries = await topicsService.getTopicMastery();

      expect(api.get).toHaveBeenCalledWith('/mastery/');
      expect(masteries).toEqual([
        {
          id: 'topic-1',
          topic: 'topic-1',
          topic_name: 'Seeded Discrete Mathematics',
          rep_num: 3,
          memory: 0.82,
          speed: 6.5,
          difficulty: 4.2,
          status: 'learned',
          last_reviewed: '2026-06-24T10:00:00Z',
          next_due: '2026-06-29T10:00:00Z',
        },
      ]);
    });

    it('aggregates multiple mastery rows that belong to the same parent topic', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 'mastery-1',
              topic: 'topic-1',
              topic_name: 'Logic',
              reps: 2,
              memory: 0.5,
              stability: 4,
              difficulty: 6,
              status: 'learned',
              last_review: '2026-06-20T10:00:00Z',
              next_review: '2026-07-01T10:00:00Z',
            },
            {
              id: 'mastery-2',
              topic: 'topic-1',
              topic_name: 'Logic',
              reps: 1,
              memory: 0.75,
              stability: 8,
              difficulty: 2,
              status: 'learning',
              last_review: '2026-06-24T10:00:00Z',
              next_review: '2026-06-28T10:00:00Z',
            },
          ],
        }),
      } as unknown as Response);

      const [mastery] = await topicsService.getTopicMastery();

      expect(mastery).toMatchObject({
        id: 'topic-1',
        topic: 'topic-1',
        topic_name: 'Logic',
        rep_num: 3,
        memory: 0.625,
        speed: 6,
        difficulty: 4,
        status: 'learning',
        last_reviewed: '2026-06-24T10:00:00Z',
        next_due: '2026-06-28T10:00:00Z',
      });
    });
  });
});
