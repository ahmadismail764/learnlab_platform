import { describe, it, expect, vi, beforeEach } from 'vitest';
import { learnersService } from '@/services/learners';
import { api } from '@/services/api';
import { authService } from '@/services/auth';

vi.mock('@/services/api', () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

vi.mock('@/services/auth', () => {
  return {
    authService: {
      getCurrentUser: vi.fn(),
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

    it('should fall back to legacy list-matching if /auth/users/me/ fails', async () => {
      // 1. /auth/users/me/ fails with non-OK status
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error or not found'));

      // 2. Mock active logged-in user
      const mockCurrentUser = {
        id: 'user-789',
        username: 'bob',
        email: 'bob@learnlab.com',
        first_name: 'Bob',
        last_name: 'Builder',
        role: 'learner',
        is_staff: false,
        date_joined: '2026-05-20T12:00:00Z',
      };
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockCurrentUser);

      // 3. /practice/learners/ list matches bob by ID
      const mockLearnersList = [
        {
          id: 'user-789',
          total_xp: 300,
          streak_count: 10,
          last_practice_date: '2026-05-20',
          user: { id: 'user-789', username: 'bob', email: 'bob@learnlab.com' },
        },
        {
          id: 'user-999',
          total_xp: 50,
          streak_count: 1,
          last_practice_date: null,
          user: { id: 'user-999', username: 'alice', email: 'alice@learnlab.com' },
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLearnersList,
      } as unknown as Response);

      const profile = await learnersService.getCurrentProfile();

      expect(authService.getCurrentUser).toHaveBeenCalledWith({ allowFallback: true });
      expect(api.get).toHaveBeenCalledWith('/practice/learners/');
      expect(profile.id).toBe('user-789');
      expect(profile.total_xp).toBe(300);
      expect(profile.streak_count).toBe(10);
      expect(profile.last_practice_date).toBe('2026-05-20');
      expect(profile.user.username).toBe('bob');
    });

    it('should fall back to raw current user data if list-matching also fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed /me'));
      
      const mockCurrentUser = {
        id: 'user-789',
        username: 'bob',
        email: 'bob@learnlab.com',
        first_name: 'Bob',
        last_name: 'Builder',
        role: 'learner',
        is_staff: false,
        date_joined: '2026-05-20T12:00:00Z',
      };
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockCurrentUser);
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed learners list'));

      const profile = await learnersService.getCurrentProfile();

      expect(profile.id).toBe('user-789');
      expect(profile.total_xp).toBe(0); // no practice telemetry available in fallback
      expect(profile.streak_count).toBe(0);
      expect(profile.user.username).toBe('bob');
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

      expect(api.get).toHaveBeenCalledWith('/practice/learners/leaderboard/');
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].id).toBe('user-1');
      expect(leaderboard[0].total_xp).toBe(500);
      expect(leaderboard[1].id).toBe('user-2');
      expect(leaderboard[1].total_xp).toBe(400);
    });

    it('should return an empty array if leaderboard fetch fails', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

      const leaderboard = await learnersService.getLeaderboard();
      expect(leaderboard).toEqual([]);
    });
  });

  describe('getTopicLeaderboard', () => {
    it('should append topic query param correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await learnersService.getTopicLeaderboard('topic-uuid-abc');

      expect(api.get).toHaveBeenCalledWith('/practice/learners/leaderboard/?topic=topic-uuid-abc');
    });
  });
});
