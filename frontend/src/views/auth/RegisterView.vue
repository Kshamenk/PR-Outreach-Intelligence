<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ApiError } from '@/api/client'
import PasswordRequirements from '@/components/ui/PasswordRequirements.vue'
import { passwordRules } from '@/utils/passwordRules'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const submitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const capsLock = ref(false)
const passwordFocused = ref(false)
const attempted = ref(false)

const hasPasswordErrors = computed(() =>
  attempted.value && !passwordRules.every((r) => r.test(password.value)),
)

const canSubmit = computed(() =>
  passwordRules.every((r) => r.test(password.value)) &&
  password.value === confirmPassword.value &&
  confirmPassword.value.length > 0,
)

function handlePasswordKeydown(e: KeyboardEvent): void {
  capsLock.value = e.getModifierState('CapsLock')
}

async function handleSubmit(): Promise<void> {
  error.value = ''
  attempted.value = true

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  submitting.value = true
  try {
    await auth.register({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Registration failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] px-4">
    <div class="w-full max-w-md">
      <!-- Brand header -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)] shadow-lg">
          <svg class="h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Create your account</h1>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">Get started with PR Outreach Intelligence</p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div
            v-if="error"
            class="flex items-center gap-2 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]"
          >
            <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
            </svg>
            {{ error }}
          </div>

          <div>
            <label for="email" class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="w-full rounded-xl border bg-[var(--color-bg-secondary)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                :class="hasPasswordErrors ? 'border-red-400 ring-1 ring-red-300' : 'border-[var(--color-border)]'"
                placeholder="Min. 8 characters"
                @focus="passwordFocused = true"
                @blur="passwordFocused = false; capsLock = false"
                @keydown="handlePasswordKeydown"
                @input="attempted = false"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                <svg v-else class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
              </button>
            </div>
            <div v-if="capsLock && passwordFocused" class="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
              <svg class="h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
              Caps Lock is on
            </div>
            <PasswordRequirements :password="password" :show-errors="attempted" />
          </div>

          <div>
            <label for="confirmPassword" class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
              Confirm password
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                placeholder="Repeat password"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg v-if="showConfirmPassword" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                <svg v-else class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="submitting || !canSubmit"
            class="w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {{ submitting ? 'Creating account...' : 'Create account' }}
          </button>
        </form>
      </div>

      <p class="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?
        <RouterLink to="/login" class="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline">
          Sign in
        </RouterLink>
      </p>
    </div>
  </div>
</template>
