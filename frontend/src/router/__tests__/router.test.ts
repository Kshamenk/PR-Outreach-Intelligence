import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { defineComponent, nextTick } from 'vue'

// Minimal component stub
const Stub = defineComponent({ template: '<div />' })

// Mock auth API & client so the store works
vi.mock('@/api/auth.api', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
}))
vi.mock('@/api/client', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  loadTokens: vi.fn(),
  hasRefreshToken: vi.fn(() => false),
}))

/**
 * Build a fresh router with the same guard logic as the real one.
 * We recreate it per test because the `initialized` flag is scoped per module.
 */
function buildRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', name: 'login', component: Stub, meta: { guest: true } },
      { path: '/register', name: 'register', component: Stub, meta: { guest: true } },
      { path: '/', name: 'dashboard', component: Stub },
      { path: '/contacts', name: 'contacts', component: Stub },
    ],
  })

  let initialized = false

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!initialized) {
      initialized = true
      await auth.tryRestore()
    }

    const isGuest = to.meta.guest === true

    if (!isGuest && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (isGuest && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
  })

  return router
}

describe('Router Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should redirect unauthenticated user to /login with redirect query', async () => {
    const router = buildRouter()
    await router.push('/contacts')
    await nextTick()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/contacts')
  })

  it('should redirect unauthenticated user from / to /login', async () => {
    const router = buildRouter()
    await router.push('/')
    await nextTick()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })

  it('should allow unauthenticated user to visit guest routes', async () => {
    const router = buildRouter()
    await router.push('/login')
    await nextTick()

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('should redirect authenticated user away from guest routes to dashboard', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'test@t.com', createdAt: '' }

    const router = buildRouter()
    await router.push('/login')
    await nextTick()

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('should allow authenticated user to visit protected routes', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'test@t.com', createdAt: '' }

    const router = buildRouter()
    await router.push('/contacts')
    await nextTick()

    expect(router.currentRoute.value.name).toBe('contacts')
  })

  it('should call tryRestore on first navigation only', async () => {
    const auth = useAuthStore()
    const spy = vi.spyOn(auth, 'tryRestore')

    const router = buildRouter()
    await router.push('/login')
    await router.push('/register')

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
