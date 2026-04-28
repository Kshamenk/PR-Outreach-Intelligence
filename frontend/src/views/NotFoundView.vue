<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p class="text-6xl font-bold text-[var(--color-border)]">404</p>
    <h1 class="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Page not found</h1>
    <p class="mt-2 text-sm text-[var(--color-text-secondary)]">The page you're looking for doesn't exist or has been moved.</p>
    <button
      class="mt-6 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
      @click="router.push({ name: 'dashboard' })"
    >
      Back to Dashboard
    </button>
  </div>
</template>
