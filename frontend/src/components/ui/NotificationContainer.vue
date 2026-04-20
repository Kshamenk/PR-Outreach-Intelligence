<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import NotificationToast from './NotificationToast.vue'

const { items, remove } = useNotifications()
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
      >
        <NotificationToast
          v-for="notification in items"
          :key="notification.id"
          :notification="notification"
          @dismiss="remove"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
