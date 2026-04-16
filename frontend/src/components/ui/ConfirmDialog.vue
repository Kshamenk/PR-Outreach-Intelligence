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
    class="rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    @cancel.prevent="onCancel"
  >
    <div class="w-96 p-6">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-2 text-sm text-gray-600">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          @click="onCancel"
        >
          Cancel
        </button>
        <button
          :class="[
            'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700',
          ]"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>
