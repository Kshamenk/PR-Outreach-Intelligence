<script setup lang="ts">
import S from '@/components/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="skeleton-delay space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <S class="h-7 w-40" />
        <S class="mt-2 h-4 w-64" />
      </div>
      <S class="h-9 w-28 rounded-lg" />
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <div v-for="i in 6" :key="i" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div class="flex items-center gap-2">
          <S class="h-8 w-8 rounded-lg" />
          <S class="h-3 w-20" />
        </div>
        <S class="mt-3 h-7 w-14" />
      </div>
    </div>

    <!-- Quick actions + Activity -->
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <S class="h-5 w-28 mb-4" />
        <div class="space-y-2">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3">
            <S class="h-5 w-5 rounded" />
            <S class="h-4 w-36" />
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:col-span-2">
        <S class="h-5 w-32 mb-4" />
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-start gap-3 border-b border-[var(--color-border)] pb-3 last:border-0">
            <S class="mt-0.5 h-5 w-5 rounded" />
            <div class="min-w-0 flex-1">
              <S class="h-4 w-48" />
              <S class="mt-1 h-3 w-64" />
            </div>
            <S class="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
