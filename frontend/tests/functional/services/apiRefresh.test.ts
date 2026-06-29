import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/services/api'

/**
 * Exercises the REAL fetchWithAuth refresh path (no mock of '@/services/api').
 * Backend runs SimpleJWT with ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION,
 * so a refresh returns a new refresh token and blacklists the old one.
 */

function makeResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body ?? ''),
    clone() {
      return this as unknown as Response
    },
  } as unknown as Response
}

describe('fetchWithAuth token refresh', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    // "remember me" → tokens live in localStorage.
    localStorage.setItem('learnlab_persist', '1')
    localStorage.setItem('learnlab_auth_token', 'access-old')
    localStorage.setItem('learnlab_refresh_token', 'refresh-old')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persists the rotated refresh token and retries the original request', async () => {
    let dataCalls = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/refresh/')) {
        return makeResponse(200, { access: 'access-new', refresh: 'refresh-new' })
      }
      dataCalls += 1
      // First hit is unauthorized; the retry (after refresh) succeeds.
      return dataCalls === 1 ? makeResponse(401) : makeResponse(200, { ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await api.get('/practice/sessions/')

    expect(response.status).toBe(200)
    // The rotated refresh token must be stored, or the next refresh reuses a
    // blacklisted token and the session dies.
    expect(localStorage.getItem('learnlab_auth_token')).toBe('access-new')
    expect(localStorage.getItem('learnlab_refresh_token')).toBe('refresh-new')
    // original (401) + refresh + retry
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('refreshes once for concurrent 401s (single-flight)', async () => {
    let refreshCalls = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/refresh/')) {
        refreshCalls += 1
        return makeResponse(200, { access: 'access-new', refresh: 'refresh-new' })
      }
      // Every data request 401s until it carries the new token.
      const hasNewToken = false // both initial requests use the stale token
      return hasNewToken ? makeResponse(200, {}) : makeResponse(401)
    })
    vi.stubGlobal('fetch', fetchMock)

    await Promise.all([
      api.get('/practice/sessions/').catch(() => undefined),
      api.get('/mastery/').catch(() => undefined),
    ])

    // Two concurrent 401s must share a single /auth/refresh/ call.
    expect(refreshCalls).toBe(1)
  })

  it('clears auth when no refresh token is available', async () => {
    localStorage.removeItem('learnlab_refresh_token')
    const fetchMock = vi.fn(async () => makeResponse(401))
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/practice/sessions/')

    expect(localStorage.getItem('learnlab_auth_token')).toBeNull()
    // No refresh attempt without a refresh token: just the original request.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
