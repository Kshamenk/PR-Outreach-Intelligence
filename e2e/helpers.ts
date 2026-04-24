import { test as base, expect, type Page } from '@playwright/test'

/** Unique suffix per worker to avoid email collisions across parallel runs. */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export interface TestUser {
  email: string
  password: string
}

/** Generate a fresh test user with a unique email. */
export function freshUser(): TestUser {
  return {
    email: `e2e-${uid()}@test.local`,
    password: 'Test1234!',
  }
}

/** Register a new user via the UI and end up on the dashboard. */
export async function registerViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Email').fill(user.email)
  await page.locator('#password').fill(user.password)
  await page.locator('#confirmPassword').fill(user.password)
  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForURL('/')
}

/** Login via the UI and end up on the dashboard. */
export async function loginViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.locator('#password').fill(user.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/')
}

/**
 * Register via the API directly (faster than UI for setup).
 * Returns access + refresh tokens for use in authenticated tests.
 */
export async function registerViaAPI(
  baseURL: string,
  user: TestUser,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${baseURL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  })
  if (!res.ok) throw new Error(`Register API failed: ${res.status}`)
  return res.json()
}

/**
 * Inject the refresh token into localStorage so the app can tryRestore.
 * The accessToken is kept in-memory by client.ts, so we only persist the refresh.
 * Must be called BEFORE navigating.
 */
export async function injectAuth(page: Page, tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('refreshToken', t.refreshToken)
  }, tokens)
}

export { base as test, expect }
