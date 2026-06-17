import { describe, it, expect, vi, beforeEach } from 'vitest';
import { learnersService } from '@/services/learners';
import { api } from '@/services/api';

vi.mock('@/services/api', () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

describe('learnersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentProfile', () => {
    it('should successfully fetch the profile from /auth/users/me/', async () => {
      const mockUserMe = {
        id: 'user-123',
        username: 'student',
        email: 'student@learnlab.com',
        first_name: 'Student',
        last_name: 'One',
        current_xp: 150,
        streak_count: 5,
        last_practice_date: '2026-05-21',
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserMe,
      } as unknown as Response);

      const profile = await learnersService.getCurrentProfile();

      expect(api.get).toHaveBeenCalledWith('/auth/users/me/');
      expect(profile.id).toBe('user-123');
      expect(profile.total_xp).toBe(150);
      expect(profile.streak_count).toBe(5);
      expect(profile.last_practice_date).toBe('2026-05-21');
      expect(profile.user.username).toBe('student');
    });

    it('should surface backend failures instead of falling back to stale profile data', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

      await expect(learnersService.getCurrentProfile()).rejects.toThrow(
        'Failed to fetch current learner profile',
      );

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/auth/users/me/');
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch and map global leaderboard profiles correctly', async () => {
      const mockLeaderboardResponse = [
        {
          id: 'user-1',
          total_xp: 500,
          streak_count: 12,
          last_practice_date: '2026-05-21',
          user: { id: 'user-1', username: 'leader' },
        },
        {
          id: 'user-2',
          total_xp: 400,
          streak_count: 8,
          last_practice_date: '2026-05-20',
          user: { id: 'user-2', username: 'runner_up' },
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboardResponse,
      } as unknown as Response);

      const leaderboard = await learnersService.getLeaderboard();

      expect(api.get).toHaveBeenCalledWith('/practice/leaderboard/');
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].id).toBe('user-1');
      expect(leaderboard[0].total_xp).toBe(500);
      expect(leaderboard[1].id).toBe('user-2');
      expect(leaderboard[1].total_xp).toBe(400);
    });

    it('should surface leaderboard failures instead of returning fake empty data', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

      await expect(learnersService.getLeaderboard()).rejects.toThrow(
        'Failed to fetch leaderboard (500)',
      );
    });
  });

  describe('getTopicLeaderboard', () => {
    it('should append topic query param correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await learnersService.getTopicLeaderboard('topic-uuid-abc');

      expect(api.get).toHaveBeenCalledWith('/practice/leaderboard/?topic=topic-uuid-abc');
    });
  });
});
