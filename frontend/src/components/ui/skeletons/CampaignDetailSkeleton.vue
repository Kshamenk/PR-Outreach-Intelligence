<script setup lang="ts">
import S from '@/components/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="skeleton-delay">
    <!-- Back link -->
    <S class="mb-4 h-4 w-36" />

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <S class="h-7 w-48" />
        <S class="h-5 w-16 rounded-full" />
      </div>
      <div class="flex gap-2">
        <S class="h-9 w-16 rounded-lg" />
        <S class="h-9 w-20 rounded-lg" />
      </div>
    </div>

    <!-- Info card -->
    <div class="mt-6 space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div>
        <S class="h-3 w-20" />
        <S class="mt-2 h-4 w-full max-w-lg" />
      </div>
      <div>
        <S class="h-3 w-16" />
        <S class="mt-2 h-4 w-full max-w-sm" />
      </div>
      <div class="flex gap-8">
        <div>
          <S class="h-3 w-16" />
          <S class="mt-2 h-4 w-24" />
        </div>
        <div>
          <S class="h-3 w-16" />
          <S class="mt-2 h-4 w-24" />
        </div>
      </div>
    </div>

    <!-- Participants -->
    <div class="mt-8">
      <div class="flex items-center justify-between">
        <S class="h-5 w-32" />
        <S class="h-9 w-32 rounded-lg" />
      </div>
      <div class="mt-4 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table class="min-w-full divide-y divide-[var(--color-border)]">
          <thead class="bg-[var(--color-bg-secondary)]">
            <tr>
              <th v-for="i in 5" :key="i" class="px-6 py-3 text-left"><S class="h-3 w-20" /></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]">
            <tr v-for="r in 3" :key="r">
              <td class="whitespace-nowrap px-6 py-4"><S class="h-4 w-28" /></td>
              <td class="whitespace-nowrap px-6 py-4"><S class="h-4 w-20" /></td>
              <td class="whitespace-nowrap px-6 py-4"><S class="h-4 w-16" /></td>
              <td class="whitespace-nowrap px-6 py-4"><S class="h-4 w-20" /></td>
              <td class="whitespace-nowrap px-6 py-4"><S class="h-4 w-24" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Interactions -->
    <div class="mt-8">
      <div class="flex items-center justify-between">
        <S class="h-5 w-24" />
        <S class="h-9 w-36 rounded-lg" />
      </div>
      <div class="mt-4 space-y-3">
        <div v-for="i in 2" :key="i" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
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
