<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import AppLayout from '@/components/layout/AppLayout.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'

const route = useRoute()
const auth = useAuthStore()
const { initTheme } = useTheme()
initTheme()
</script>

<template>
  <div v-if="auth.loading" class="flex h-screen items-center justify-center bg-[var(--color-bg-primary)]">
    <p class="text-[var(--color-text-secondary)]">Loading...</p>
  </div>
  <template v-else>
    <AppLayout v-if="auth.isAuthenticated && route.meta.guest !== true">
      <RouterView />
    </AppLayout>
    <RouterView v-else />
  </template>
  <NotificationContainer />
</template>
