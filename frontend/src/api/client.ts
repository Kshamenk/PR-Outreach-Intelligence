import type { AuthResponseDTO } from '@pr-outreach/shared-types'

const BASE_URL = '/api'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshPromise: Promise<void> | null = null

// ── Token Management ──

export function setTokens(access: string, refresh: string): void {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('refreshToken', refresh)
}

export function loadTokens(): void {
  refreshToken = localStorage.getItem('refreshToken')
}

export function clearTokens(): void {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('refreshToken')
}

export function getAccessToken(): string | null {
  return accessToken
}

export function hasRefreshToken(): boolean {
  return !!refreshToken
}

// ── Error Class ──

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Core Fetch ──

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && !skipAuth && refreshToken) {
    await tryRefresh()
    // Retry with new token
    headers['Authorization'] = `Bearer ${accessToken}`
    const retry = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })
    if (!retry.ok) {
      const body = await retry.json().catch(() => ({ error: 'Request failed' }))
      throw new ApiError(retry.status, body.error ?? 'Request failed')
    }
    if (retry.status === 204) return undefined as T
    return retry.json()
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(res.status, body.error ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

async function tryRefresh(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise
    return
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        clearTokens()
        window.location.href = '/login'
        return
      }

      const data: AuthResponseDTO = await res.json()
      setTokens(data.accessToken, data.refreshToken)
    } catch {
      clearTokens()
      window.location.href = '/login'
    }
  })()

  try {
    await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// ── HTTP Methods ──

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export function post<T>(path: string, body?: unknown, skipAuth = false): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, skipAuth)
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}

export function del<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
}
