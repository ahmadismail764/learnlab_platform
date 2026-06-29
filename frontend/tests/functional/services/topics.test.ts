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
    it('normalizes the per-subtopic mastery contract (subtopic = UI topic, topic = UI category)', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'mastery-1',
            topic: 'topic-1',
            topic_name: 'Seeded Discrete Mathematics',
            subtopic: 'sub-1',
            subtopic_name: 'Logic Basics',
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
          id: 'sub-1',
          subtopic: 'sub-1',
          subtopic_name: 'Logic Basics',
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

    it('returns one row per subtopic and no longer collapses siblings into the parent topic', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 'mastery-1',
              topic: 'topic-1',
              topic_name: 'Logic',
              subtopic: 'sub-1',
              subtopic_name: 'Propositional Logic',
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
              subtopic: 'sub-2',
              subtopic_name: 'Predicate Logic',
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

      const masteries = await topicsService.getTopicMastery();

      expect(masteries).toHaveLength(2);
      expect(masteries[0]).toMatchObject({
        id: 'sub-1',
        subtopic: 'sub-1',
        subtopic_name: 'Propositional Logic',
        topic: 'topic-1',
        topic_name: 'Logic',
        rep_num: 2,
        memory: 0.5,
        speed: 4,
      });
      expect(masteries[1]).toMatchObject({
        id: 'sub-2',
        subtopic: 'sub-2',
        subtopic_name: 'Predicate Logic',
        topic: 'topic-1',
        topic_name: 'Logic',
        rep_num: 1,
        memory: 0.75,
        speed: 8,
      });
    });
  });
});
