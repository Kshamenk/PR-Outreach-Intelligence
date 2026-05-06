<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'default'
  }>(),
  { confirmLabel: 'Confirm', variant: 'default' },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) dialogRef.value?.showModal()
    else dialogRef.value?.close()
  },
)

function onCancel() {
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="mx-4 w-full max-w-[26rem] rounded-2xl bg-[var(--color-surface)] p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    @cancel.prevent="onCancel"
  >
    <div>
      <div class="flex items-center justify-between border-b border-[var(--color-border)] px-6 pt-6 pb-4">
        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{{ title }}</h3>
        <button
          type="button"
          class="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
          @click="onCancel"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div class="px-6 py-5">
        <p class="text-sm leading-relaxed text-[var(--color-text-secondary)]">{{ message }}</p>
      </div>
      <div class="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
        <button
          class="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          @click="onCancel"
        >
          Cancel
        </button>
        <button
          :class="[
            'rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md',
            variant === 'danger'
              ? 'bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)]'
              : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
          ]"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>
