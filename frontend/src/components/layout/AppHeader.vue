<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
    <div />
    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-600">{{ auth.user?.email }}</span>
      <button
        class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>
  </header>
</template>
