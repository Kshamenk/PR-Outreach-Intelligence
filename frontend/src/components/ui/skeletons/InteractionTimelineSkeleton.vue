<script setup lang="ts">
import S from '@/components/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="skeleton-delay space-y-3">
    <div v-for="i in 3" :key="i" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <S class="h-5 w-5 rounded" />
          <S class="h-5 w-14 rounded-full" />
          <S class="h-5 w-14 rounded-full" />
        </div>
        <S class="h-3 w-16" />
      </div>
      <S class="mt-2 h-4 w-48" />
      <S class="mt-1 h-3 w-full max-w-md" />
    </div>
  </div>
</template>
