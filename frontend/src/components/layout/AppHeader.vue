<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const auth = useAuthStore()
const router = useRouter()
const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

async function handleLogout(): Promise<void> {
  open.value = false
  await auth.logout()
  router.push('/login')
}

const { theme } = useTheme()

function cycleTheme() {
  const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
  theme.value = order[(order.indexOf(theme.value) + 1) % 3]
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const initials = (email: string | undefined) => {
  if (!email) return '?'
  return email.slice(0, 2).toUpperCase()
}
</script>

<template>
  <header class="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
    <!-- Hamburger (mobile only) -->
    <button
      class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] md:hidden"
      @click="emit('toggle-sidebar')"
    >
      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </button>
    <div class="hidden md:block" />

    <!-- User dropdown -->
    <div ref="dropdownRef" class="relative">
      <button
        class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-[var(--color-bg-secondary)]"
        @click="toggle"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white"
        >
          {{ initials(auth.user?.email) }}
        </div>
        <span class="hidden text-sm font-medium text-[var(--color-text-primary)] sm:inline">{{ auth.user?.email }}</span>
        <svg
          class="h-4 w-4 text-[var(--color-text-secondary)] transition-transform"
          :class="{ 'rotate-180': open }"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="scale-95 opacity-0"
        enter-to-class="scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="scale-100 opacity-100"
        leave-to-class="scale-95 opacity-0"
      >
        <div
          v-if="open"
          class="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
        >
          <!-- User info -->
          <div class="border-b border-[var(--color-border)] px-4 py-4">
            <p class="text-sm font-semibold text-[var(--color-text-primary)]">{{ auth.user?.email }}</p>
            <p class="mt-1 text-xs text-[var(--color-text-secondary)]">Signed in</p>
          </div>

          <!-- Actions -->
          <div class="p-2">
            <!-- Theme toggle -->
            <button
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="cycleTheme"
            >
              <svg v-if="theme === 'light'" class="h-4 w-4 text-[var(--color-text-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>
              <svg v-else-if="theme === 'dark'" class="h-4 w-4 text-[var(--color-text-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
              <svg v-else class="h-4 w-4 text-[var(--color-text-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>
              {{ theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System' }}
            </button>

            <button
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="handleLogout"
            >
              <svg
                class="h-4 w-4 text-[var(--color-danger)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
              Log out
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </header>
</template>
