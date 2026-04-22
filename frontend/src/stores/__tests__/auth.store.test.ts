import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth.store'

// Mock the auth API
vi.mock('@/api/auth.api', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
}))

// Mock the client token functions
vi.mock('@/api/client', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  loadTokens: vi.fn(),
  hasRefreshToken: vi.fn(() => false),
}))

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should start with no user and not authenticated', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('register should set tokens and fetch user profile', async () => {
    const authApi = await import('@/api/auth.api')
    const client = await import('@/api/client')

    vi.mocked(authApi.register).mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    })
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      createdAt: '2026-01-01',
    })

    const store = useAuthStore()
    await store.register({ email: 'test@test.com', password: 'pass1234' })

    expect(client.setTokens).toHaveBeenCalledWith('access-123', 'refresh-456')
    expect(store.user).toEqual({ id: 1, email: 'test@test.com', createdAt: '2026-01-01' })
    expect(store.isAuthenticated).toBe(true)
  })

  it('login should set tokens and fetch user profile', async () => {
    const authApi = await import('@/api/auth.api')
    const client = await import('@/api/client')

    vi.mocked(authApi.login).mockResolvedValue({
      user: { id: 2, email: 'login@test.com' },
      accessToken: 'access-abc',
      refreshToken: 'refresh-def',
    })
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 2,
      email: 'login@test.com',
      createdAt: '2026-02-01',
    })

    const store = useAuthStore()
    await store.login({ email: 'login@test.com', password: 'pass1234' })

    expect(client.setTokens).toHaveBeenCalledWith('access-abc', 'refresh-def')
    expect(store.isAuthenticated).toBe(true)
  })

  it('logout should clear tokens and user', async () => {
    const authApi = await import('@/api/auth.api')
    const client = await import('@/api/client')

    vi.mocked(authApi.logout).mockResolvedValue(undefined)

    const store = useAuthStore()
    // Set user first
    store.user = { id: 1, email: 'test@test.com', createdAt: '' }

    await store.logout()

    expect(client.clearTokens).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('tryRestore should skip if no refresh token', async () => {
    const client = await import('@/api/client')
    vi.mocked(client.hasRefreshToken).mockReturnValue(false)

    const store = useAuthStore()
    await store.tryRestore()

    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('tryRestore should restore session from refresh token', async () => {
    const authApi = await import('@/api/auth.api')
    const client = await import('@/api/client')

    localStorage.setItem('refreshToken', 'saved-refresh')
    vi.mocked(client.hasRefreshToken).mockReturnValue(true)
    vi.mocked(authApi.refresh).mockResolvedValue({
      user: { id: 1, email: 'restored@test.com' },
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    })
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 1,
      email: 'restored@test.com',
      createdAt: '2026-01-01',
    })

    const store = useAuthStore()
    await store.tryRestore()

    expect(client.setTokens).toHaveBeenCalledWith('new-access', 'new-refresh')
    expect(store.isAuthenticated).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('tryRestore should clear state on failed refresh', async () => {
    const authApi = await import('@/api/auth.api')
    const client = await import('@/api/client')

    localStorage.setItem('refreshToken', 'expired-refresh')
    vi.mocked(client.hasRefreshToken).mockReturnValue(true)
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('Token expired'))

    const store = useAuthStore()
    await store.tryRestore()

    expect(client.clearTokens).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
  })
})
