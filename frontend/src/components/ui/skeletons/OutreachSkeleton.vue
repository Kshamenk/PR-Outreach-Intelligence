<script setup lang="ts">
import S from '@/components/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="skeleton-delay space-y-6">
    <!-- Header -->
    <div>
      <S class="h-7 w-44" />
      <S class="mt-2 h-4 w-72" />
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left: Config card -->
      <div class="space-y-6 lg:col-span-2">
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <S class="h-5 w-32" />
          <!-- Selects -->
          <div v-for="i in 2" :key="i">
            <S class="h-3 w-16 mb-2" />
            <S class="h-9 w-full rounded-lg" />
          </div>
          <!-- Radio groups -->
          <div v-for="i in 2" :key="'r' + i">
            <S class="h-3 w-12 mb-2" />
            <div class="flex gap-2">
              <S v-for="j in 3" :key="j" class="h-9 w-20 rounded-lg" />
            </div>
          </div>
          <S class="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <!-- Right: History -->
      <div>
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <S class="h-5 w-36 mb-4" />
          <div class="space-y-3">
            <div v-for="i in 4" :key="i" class="rounded-lg border border-[var(--color-border)] p-3">
              <S class="h-4 w-full max-w-[12rem]" />
              <div class="mt-2 flex items-center gap-2">
                <S class="h-4 w-14 rounded-full" />
                <S class="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
