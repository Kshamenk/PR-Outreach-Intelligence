<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ContactResponseDTO } from '@pr-outreach/shared-types'
import { useContactsStore } from '@/stores/contacts.store'
import { ApiError } from '@/api/client'

const props = defineProps<{
  open: boolean
  contact?: ContactResponseDTO | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const store = useContactsStore()
const dialogRef = ref<HTMLDialogElement | null>(null)
const submitting = ref(false)
const error = ref('')

const name = ref('')
const email = ref('')
const outlet = ref('')
const topicsRaw = ref('')

const isEdit = computed(() => !!props.contact)
const title = computed(() => (isEdit.value ? 'Edit Contact' : 'New Contact'))

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      error.value = ''
      if (props.contact) {
        name.value = props.contact.name
        email.value = props.contact.email
        outlet.value = props.contact.outlet
        topicsRaw.value = props.contact.topics.join(', ')
      } else {
        name.value = ''
        email.value = ''
        outlet.value = ''
        topicsRaw.value = ''
      }
      dialogRef.value?.showModal()
    } else {
      dialogRef.value?.close()
    }
  },
)

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  const topics = topicsRaw.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  try {
    if (isEdit.value && props.contact) {
      await store.update(props.contact.id, { name: name.value, email: email.value, outlet: outlet.value, topics })
    } else {
      await store.create({ name: name.value, email: email.value, outlet: outlet.value, topics })
    }
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to save contact'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    @cancel.prevent="emit('close')"
  >
    <form class="w-[28rem] p-6" @submit.prevent="handleSubmit">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>

      <div v-if="error" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

      <div class="mt-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name *</label>
          <input
            v-model="name"
            required
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email *</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Outlet *</label>
          <input
            v-model="outlet"
            required
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Topics</label>
          <input
            v-model="topicsRaw"
            placeholder="tech, AI, startups"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <p class="mt-1 text-xs text-gray-500">Comma-separated list of topics</p>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : isEdit ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
