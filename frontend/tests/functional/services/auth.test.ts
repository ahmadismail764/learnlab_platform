import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/auth'
import { api, getToken } from '@/services/api'

vi.mock('@/services/api', () => {
  return {
    api: {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn(),
      postPublic: vi.fn(),
    },
    getToken: vi.fn(),
    getTokenStorage: vi.fn(() => localStorage),
    parseApiError: vi.fn(async (_response: Response, fallback: string) => ({ message: fallback })),
    throwApiError: vi.fn(async (_response: Response, fallback: string) => {
      throw new Error(fallback)
    }),
  }
})

describe('authService preferences and logout contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('fetches persisted user preferences from the merged backend endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: { language: 'en', theme: 'dark' } }),
    } as unknown as Response)

    const preferences = await authService.getPreferences()

    expect(api.get).toHaveBeenCalledWith('/auth/users/me/preferences/')
    expect(preferences).toEqual({ language: 'en', theme: 'dark' })
  })

  it('patches preferences as a flat JSON object for the current backend view', async () => {
    const payload = { language: 'ar', theme: 'light' }
    vi.mocked(api.patch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: payload }),
    } as unknown as Response)

    const preferences = await authService.updatePreferences(payload)

    expect(api.patch).toHaveBeenCalledWith('/auth/users/me/preferences/', payload)
    expect(preferences).toEqual(payload)
  })

  it('blacklists the refresh token before clearing local auth state', async () => {
    localStorage.setItem('learnlab_auth_token', 'access-token')
    localStorage.setItem('learnlab_refresh_token', 'refresh-token')
    localStorage.setItem('learnlab_persist', '1')
    sessionStorage.setItem('learnlab_auth_token', 'session-access')
    sessionStorage.setItem('learnlab_refresh_token', 'session-refresh')
    vi.mocked(getToken).mockReturnValueOnce('refresh-token')
    vi.mocked(api.post).mockResolvedValueOnce({
      ok: true,
      status: 205,
    } as unknown as Response)

    await authService.logout()

    expect(api.post).toHaveBeenCalledWith('/auth/logout/', { refresh: 'refresh-token' })
    expect(localStorage.getItem('learnlab_auth_token')).toBeNull()
    expect(localStorage.getItem('learnlab_refresh_token')).toBeNull()
    expect(localStorage.getItem('learnlab_persist')).toBeNull()
    expect(sessionStorage.getItem('learnlab_auth_token')).toBeNull()
    expect(sessionStorage.getItem('learnlab_refresh_token')).toBeNull()
  })
})
