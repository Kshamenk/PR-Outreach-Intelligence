<script setup lang="ts">
import S from '@/components/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="skeleton-delay">
    <!-- Back link -->
    <S class="mb-4 h-4 w-32" />

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <S class="h-7 w-48" />
        <S class="mt-2 h-4 w-32" />
      </div>
      <div class="flex gap-2">
        <S class="h-9 w-16 rounded-lg" />
        <S class="h-9 w-20 rounded-lg" />
      </div>
    </div>

    <!-- Info grid -->
    <div class="mt-6 grid grid-cols-2 gap-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:grid-cols-4">
      <div v-for="i in 4" :key="i">
        <S class="h-3 w-20" />
        <S class="mt-2 h-4 w-28" />
      </div>
    </div>

    <!-- Topics -->
    <div class="mt-4">
      <S class="h-3 w-14" />
      <div class="mt-2 flex gap-2">
        <S v-for="i in 3" :key="i" class="h-6 w-16 rounded-full" />
      </div>
    </div>

    <!-- Interactions section -->
    <div class="mt-8">
      <div class="flex items-center justify-between">
        <S class="h-5 w-28" />
        <S class="h-9 w-36 rounded-lg" />
      </div>
      <div class="mt-4 space-y-3">
        <div v-for="i in 3" :key="i" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div class="flex items-center gap-2">
            <S class="h-5 w-5 rounded" />
            <S class="h-5 w-14 rounded-full" />
            <S class="h-5 w-14 rounded-full" />
          </div>
          <S class="mt-2 h-4 w-48" />
          <S class="mt-1 h-3 w-full max-w-md" />
        </div>
      </div>
    </div>
  </div>
</template>
