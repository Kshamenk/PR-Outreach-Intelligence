import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setTokens, clearTokens, getAccessToken } from '../client'

/**
 * These tests cover the refresh-token retry and deduplication logic
 * in the API client's `request()` and `tryRefresh()` functions.
 */
describe('Client refresh & retry', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should retry request after 401 with refreshed token', async () => {
    setTokens('expired-access', 'valid-refresh')

    let callCount = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string, opts: any) => {
      // Refresh endpoint
      if (url.includes('/auth/refresh')) {
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            user: { id: 1, email: 'test@t.com' },
          }),
        }
      }
      callCount++
      // First call: 401. Second call (retry): 200.
      if (callCount === 1) {
        return { ok: false, status: 401, json: () => Promise.resolve({ error: 'Token expired' }) }
      }
      return { ok: true, status: 200, json: () => Promise.resolve({ data: 'success' }) }
    }))

    const { get } = await import('../client')
    const result = await get('/protected')

    expect(result).toEqual({ data: 'success' })
    expect(getAccessToken()).toBe('new-access')
    // 3 calls total: original 401 + refresh + retry
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('should clear tokens and redirect when refresh fails', async () => {
    setTokens('expired-access', 'invalid-refresh')

    // Mock window.location
    const locationMock = { href: '' }
    vi.stubGlobal('location', locationMock)

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        return { ok: false, status: 401, json: () => Promise.resolve({ error: 'Invalid token' }) }
      }
      return { ok: false, status: 401, json: () => Promise.resolve({ error: 'Token expired' }) }
    }))

    const { get } = await import('../client')

    // After refresh fails, the retry will also fail, throwing ApiError
    await expect(get('/protected')).rejects.toThrow()
    expect(locationMock.href).toBe('/login')
  })

  it('should deduplicate concurrent refresh calls', async () => {
    setTokens('expired-access', 'valid-refresh')

    let refreshCallCount = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCallCount++
        // Small delay to simulate network
        await new Promise((r) => setTimeout(r, 10))
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            user: { id: 1, email: 'test@t.com' },
          }),
        }
      }
      // All initial calls return 401
      return { ok: false, status: 401, json: () => Promise.resolve({ error: 'expired' }) }
    }))

    const { get } = await import('../client')

    // Fire 3 requests concurrently — all should get 401, but only 1 refresh
    await Promise.allSettled([get('/a'), get('/b'), get('/c')])

    // Only 1 refresh call despite 3 concurrent 401s
    expect(refreshCallCount).toBe(1)
  })
})
