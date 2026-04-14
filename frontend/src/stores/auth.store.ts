import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MeResponseDTO, RegisterDTO, LoginDTO } from '@pr-outreach/shared-types'
import * as authApi from '@/api/auth.api'
import { setTokens, clearTokens, loadTokens, hasRefreshToken } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<MeResponseDTO | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function register(dto: RegisterDTO): Promise<void> {
    const res = await authApi.register(dto)
    setTokens(res.accessToken, res.refreshToken)
    user.value = { id: res.user.id, email: res.user.email, createdAt: '' }
    await fetchMe()
  }

  async function login(dto: LoginDTO): Promise<void> {
    const res = await authApi.login(dto)
    setTokens(res.accessToken, res.refreshToken)
    user.value = { id: res.user.id, email: res.user.email, createdAt: '' }
    await fetchMe()
  }

  async function fetchMe(): Promise<void> {
    try {
      user.value = await authApi.getMe()
    } catch {
      user.value = null
      clearTokens()
    }
  }

  async function tryRestore(): Promise<void> {
    loadTokens()
    if (!hasRefreshToken()) return
    loading.value = true
    try {
      const res = await authApi.refresh(localStorage.getItem('refreshToken')!)
      setTokens(res.accessToken, res.refreshToken)
      await fetchMe()
    } catch {
      clearTokens()
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      const rt = localStorage.getItem('refreshToken')
      if (rt) await authApi.logout(rt)
    } finally {
      clearTokens()
      user.value = null
    }
  }

  return { user, loading, isAuthenticated, register, login, logout, tryRestore }
})
