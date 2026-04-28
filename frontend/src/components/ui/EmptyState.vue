<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    actionLabel?: string
  }>(),
  { description: '', actionLabel: '' },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="mb-4 text-4xl text-gray-300">📭</div>
    <h3 class="text-lg font-medium text-[var(--color-text-primary)]">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-[var(--color-text-secondary)]">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
