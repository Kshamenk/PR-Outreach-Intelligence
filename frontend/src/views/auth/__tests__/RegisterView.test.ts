import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../RegisterView.vue'

const registerMock = vi.fn()
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    register: registerMock,
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
      { path: '/register', name: 'register', component: RegisterView },
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  })
}

function mountRegister() {
  const router = buildRouter()
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    wrapper: mount(RegisterView, { global: { plugins: [pinia, router] } }),
    router,
  }
}

describe('RegisterView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the create account heading', () => {
    const { wrapper } = mountRegister()
    expect(wrapper.find('h1').text()).toContain('Create your account')
  })

  it('renders email, password and confirm password inputs', () => {
    const { wrapper } = mountRegister()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    const pwInputs = wrapper.findAll('input[type="password"]')
    expect(pwInputs).toHaveLength(2)
  })

  it('shows error when passwords do not match', async () => {
    const { wrapper } = mountRegister()
    await wrapper.find('input[type="email"]').setValue('a@b.com')
    const pws = wrapper.findAll('input[type="password"]')
    await pws[0].setValue('password1')
    await pws[1].setValue('password2')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Passwords do not match')
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    const { wrapper } = mountRegister()
    await wrapper.find('input[type="email"]').setValue('a@b.com')
    const pws = wrapper.findAll('input[type="password"]')
    await pws[0].setValue('short')
    await pws[1].setValue('short')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('at least 8 characters')
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('calls auth.register and navigates to / on success', async () => {
    registerMock.mockResolvedValue(undefined)
    const { wrapper, router } = mountRegister()
    await router.isReady()
    await router.push('/register')

    await wrapper.find('input[type="email"]').setValue('new@user.com')
    const pws = wrapper.findAll('input[type="password"]')
    await pws[0].setValue('securepass')
    await pws[1].setValue('securepass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(registerMock).toHaveBeenCalledWith({
      email: 'new@user.com',
      password: 'securepass',
    })
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('shows API error message on register failure', async () => {
    const { ApiError } = await import('@/api/client')
    registerMock.mockRejectedValue(new ApiError('Email already exists', 409))
    const { wrapper } = mountRegister()

    await wrapper.find('input[type="email"]').setValue('dup@user.com')
    const pws = wrapper.findAll('input[type="password"]')
    await pws[0].setValue('password123')
    await pws[1].setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Email already exists')
  })

  it('renders a link to login', () => {
    const { wrapper } = mountRegister()
    const link = wrapper.find('a[href="/login"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Sign in')
  })
})
