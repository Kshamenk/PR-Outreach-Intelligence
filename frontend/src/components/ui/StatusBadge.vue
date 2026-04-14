<script setup lang="ts">
defineProps<{
  label: string
  variant: 'draft' | 'active' | 'paused' | 'completed' | 'inbound' | 'outbound' | 'internal' | 'email' | 'note'
}>()

const colors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 ring-gray-300',
  active: 'bg-green-50 text-green-700 ring-green-300',
  paused: 'bg-yellow-50 text-yellow-700 ring-yellow-300',
  completed: 'bg-blue-50 text-blue-700 ring-blue-300',
  inbound: 'bg-indigo-50 text-indigo-700 ring-indigo-300',
  outbound: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  internal: 'bg-gray-100 text-gray-600 ring-gray-300',
  email: 'bg-sky-50 text-sky-700 ring-sky-300',
  note: 'bg-amber-50 text-amber-700 ring-amber-300',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      colors[variant] ?? colors.draft,
    ]"
  >
    {{ label }}
  </span>
</template>
