<script setup lang="ts">
import type { Notification, NotificationType } from '@/composables/useNotifications'

defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  dismiss: [id: number]
}>()

const icons: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const styles: Record<NotificationType, string> = {
  success: 'border-green-400 bg-green-50 text-green-800',
  error: 'border-red-400 bg-red-50 text-red-800',
  info: 'border-blue-400 bg-blue-50 text-blue-800',
  warning: 'border-yellow-400 bg-yellow-50 text-yellow-800',
}

const iconStyles: Record<NotificationType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
}
</script>

<template>
  <div
    :class="[
      'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300',
      styles[notification.type],
    ]"
    role="alert"
  >
    <span :class="['mt-0.5 text-sm font-bold', iconStyles[notification.type]]">
      {{ icons[notification.type] }}
    </span>
    <p class="flex-1 text-sm font-medium">{{ notification.message }}</p>
    <button
      class="ml-2 text-sm opacity-60 transition-opacity hover:opacity-100"
      @click="emit('dismiss', notification.id)"
    >
      ✕
    </button>
  </div>
</template>
