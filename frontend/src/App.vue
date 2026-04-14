<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.loading" class="flex h-screen items-center justify-center">
    <p class="text-gray-500">Loading...</p>
  </div>
  <template v-else>
    <AppLayout v-if="auth.isAuthenticated && route.meta.guest !== true">
      <RouterView />
    </AppLayout>
    <RouterView v-else />
  </template>
</template>
