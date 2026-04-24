import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../LoginView.vue'

// Mock auth store
const loginMock = vi.fn()
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    login: loginMock,
  }),
}))

vi.mock('@/api/client', () => {
  class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }
  return { ApiError }
})

function buildRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/register', name: 'register', component: { template: '<div />' } },
    ],
  })
}

function mountLogin() {
  const router = buildRouter()
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(LoginView, {
    global: { plugins: [pinia, router] },
  })
  return { wrapper, router }
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the sign-in heading', () => {
    const { wrapper } = mountLogin()
    expect(wrapper.find('h1').text()).toContain('Sign in')
  })

  it('renders email and password inputs', () => {
    const { wrapper } = mountLogin()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('renders a link to register', () => {
    const { wrapper } = mountLogin()
    const link = wrapper.find('a[href="/register"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Sign up')
  })

  it('calls auth.login on submit and navigates to /', async () => {
    loginMock.mockResolvedValue(undefined)
    const { wrapper, router } = mountLogin()

    await router.isReady()
    await router.push('/login')

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('shows error message when login fails with ApiError', async () => {
    const { ApiError } = await import('@/api/client')
    loginMock.mockRejectedValue(new ApiError('Invalid email or password', 401))
    const { wrapper } = mountLogin()

    await wrapper.find('input[type="email"]').setValue('bad@example.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid email or password')
  })

  it('shows generic error for non-ApiError', async () => {
    loginMock.mockRejectedValue(new Error('Network fail'))
    const { wrapper } = mountLogin()

    await wrapper.find('input[type="email"]').setValue('a@b.com')
    await wrapper.find('input[type="password"]').setValue('12345678')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Login failed')
  })

  it('disables button while submitting', async () => {
    let resolve: () => void
    loginMock.mockReturnValue(new Promise<void>((r) => { resolve = r }))
    const { wrapper } = mountLogin()

    await wrapper.find('input[type="email"]').setValue('a@b.com')
    await wrapper.find('input[type="password"]').setValue('12345678')
    await wrapper.find('form').trigger('submit')

    // While promise is pending
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="submit"]').text()).toContain('Signing in')

    resolve!()
    await flushPromises()
  })
})
