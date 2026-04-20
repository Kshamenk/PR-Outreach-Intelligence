<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p class="text-6xl font-bold text-gray-300">404</p>
    <h1 class="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
    <p class="mt-2 text-sm text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
    <button
      class="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      @click="router.push({ name: 'dashboard' })"
    >
      Back to Dashboard
    </button>
  </div>
</template>
