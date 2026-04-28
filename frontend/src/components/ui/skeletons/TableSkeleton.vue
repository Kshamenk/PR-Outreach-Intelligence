<script setup lang="ts">
import S from '@/components/ui/SkeletonBlock.vue'

const props = withDefaults(defineProps<{
  columns?: number
  rows?: number
}>(), {
  columns: 4,
  rows: 5,
})
</script>

<template>
  <div class="skeleton-delay mt-4 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
    <table class="min-w-full divide-y divide-[var(--color-border)]">
      <thead class="bg-[var(--color-bg-secondary)]">
        <tr>
          <th v-for="i in props.columns" :key="i" class="px-6 py-3 text-left">
            <S class="h-3 w-20" />
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--color-border)]">
        <tr v-for="r in props.rows" :key="r">
          <td v-for="c in props.columns" :key="c" class="whitespace-nowrap px-6 py-4">
            <S :class="['h-4', c === 1 ? 'w-32' : 'w-24']" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
