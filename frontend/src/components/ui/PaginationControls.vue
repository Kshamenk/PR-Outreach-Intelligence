<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  limit: number
  offset: number
}>()

const emit = defineEmits<{
  'update:offset': [value: number]
}>()

const from = computed(() => (props.total === 0 ? 0 : props.offset + 1))
const to = computed(() => Math.min(props.offset + props.limit, props.total))
const hasPrev = computed(() => props.offset > 0)
const hasNext = computed(() => props.offset + props.limit < props.total)

function prev() {
  emit('update:offset', Math.max(0, props.offset - props.limit))
}

function next() {
  emit('update:offset', props.offset + props.limit)
}
</script>

<template>
  <div class="flex items-center justify-between border-t border-gray-200 pt-4">
    <p class="text-sm text-gray-600">
      Showing <span class="font-medium">{{ from }}</span>–<span class="font-medium">{{ to }}</span>
      of <span class="font-medium">{{ total }}</span>
    </p>
    <div class="flex gap-2">
      <button
        :disabled="!hasPrev"
        class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        @click="prev"
      >
        Previous
      </button>
      <button
        :disabled="!hasNext"
        class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        @click="next"
      >
        Next
      </button>
    </div>
  </div>
</template>
