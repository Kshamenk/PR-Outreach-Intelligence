<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const route = useRoute()
const sidebarOpen = ref(false)

// Close drawer on navigation
watch(() => route.path, () => { sidebarOpen.value = false })
</script>

<template>
  <div class="flex h-screen bg-[var(--color-bg-primary)]">
    <!-- Desktop sidebar -->
    <div class="hidden md:flex">
      <AppSidebar />
    </div>

    <!-- Mobile drawer backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 md:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Mobile drawer panel -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div v-if="sidebarOpen" class="fixed inset-y-0 left-0 z-50 md:hidden">
        <AppSidebar />
      </div>
    </Transition>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
