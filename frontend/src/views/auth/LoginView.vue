<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ApiError } from '@/api/client'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit(): Promise<void> {
  error.value = ''
  submitting.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <h1 class="mb-8 text-center text-2xl font-bold text-gray-900">Sign in to PR Outreach</h1>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {{ error }}
        </div>

        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {{ submitting ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        Don't have an account?
        <RouterLink to="/register" class="font-medium text-gray-900 hover:underline">
          Sign up
        </RouterLink>
      </p>
    </div>
  </div>
</template>
