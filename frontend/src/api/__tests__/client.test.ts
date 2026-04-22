import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setTokens,
  clearTokens,
  loadTokens,
  getAccessToken,
  hasRefreshToken,
  ApiError,
} from '../client'

describe('Token management', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })

  it('setTokens should store access in memory and refresh in localStorage', () => {
    setTokens('access-123', 'refresh-456')
    expect(getAccessToken()).toBe('access-123')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456')
    expect(hasRefreshToken()).toBe(true)
  })

  it('clearTokens should remove both tokens', () => {
    setTokens('access-123', 'refresh-456')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(hasRefreshToken()).toBe(false)
  })

  it('loadTokens should load refresh from localStorage', () => {
    localStorage.setItem('refreshToken', 'stored-token')
    loadTokens()
    expect(hasRefreshToken()).toBe(true)
  })

  it('hasRefreshToken should return false when no token', () => {
    expect(hasRefreshToken()).toBe(false)
  })
})

describe('ApiError', () => {
  it('should have status and message', () => {
    const err = new ApiError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err.name).toBe('ApiError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('HTTP methods', () => {
  beforeEach(() => {
    clearTokens()
    vi.restoreAllMocks()
  })

  it('get should call fetch with GET method and auth header', async () => {
    setTokens('test-token', 'refresh')

    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { get } = await import('../client')
    const result = await get('/test')

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token',
      }),
    }))
    expect(result).toEqual({ data: 'test' })
  })

  it('post should send JSON body', async () => {
    setTokens('test-token', 'refresh')

    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { post } = await import('../client')
    await post('/test', { name: 'John' })

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'John' }),
    }))
  })

  it('should throw ApiError on non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad input' }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { get } = await import('../client')

    await expect(get('/fail')).rejects.toThrow('Bad input')
  })

  it('should return undefined for 204 responses', async () => {
    setTokens('test-token', 'refresh')

    const mockResponse = { ok: true, status: 204 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { del } = await import('../client')
    const result = await del('/item/1')

    expect(result).toBeUndefined()
  })
})
