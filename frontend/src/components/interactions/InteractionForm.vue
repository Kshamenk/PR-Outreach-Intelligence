<script setup lang="ts">
import { ref, watch } from 'vue'
import type { InteractionDirection, InteractionChannel, InteractionStatus } from '@pr-outreach/shared-types'
import { useInteractionsStore } from '@/stores/interactions.store'
import { useContactsStore } from '@/stores/contacts.store'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { ApiError } from '@/api/client'

const props = defineProps<{
  open: boolean
  contactId?: number
  campaignId?: number
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const interactionsStore = useInteractionsStore()
const contactsStore = useContactsStore()
const campaignsStore = useCampaignsStore()

const dialogRef = ref<HTMLDialogElement | null>(null)
const submitting = ref(false)
const error = ref('')

const contactId = ref<number | undefined>(undefined)
const campaignId = ref<number | undefined>(undefined)
const direction = ref<InteractionDirection>('outbound')
const channel = ref<InteractionChannel>('email')
const status = ref<InteractionStatus>('sent')
const subject = ref('')
const content = ref('')
const occurredAt = ref('')

const directions: InteractionDirection[] = ['outbound', 'inbound', 'internal']
const channels: InteractionChannel[] = ['email', 'note']
const statuses: InteractionStatus[] = ['draft', 'sent', 'delivered', 'failed', 'replied', 'archived']

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      error.value = ''
      contactId.value = props.contactId
      campaignId.value = props.campaignId
      direction.value = 'outbound'
      channel.value = 'email'
      status.value = 'sent'
      subject.value = ''
      content.value = ''
      occurredAt.value = nowLocal()

      if (!props.contactId) contactsStore.fetchList(200, 0)
      if (!props.campaignId) campaignsStore.fetchList(200, 0)

      dialogRef.value?.showModal()
    } else {
      dialogRef.value?.close()
    }
  },
)

async function handleSubmit() {
  if (!contactId.value) {
    error.value = 'Please select a contact'
    return
  }

  error.value = ''
  submitting.value = true
  try {
    await interactionsStore.create({
      contactId: contactId.value,
      campaignId: campaignId.value,
      direction: direction.value,
      channel: channel.value,
      status: status.value,
      subject: subject.value || undefined,
      content: content.value,
      occurredAt: occurredAt.value ? new Date(occurredAt.value).toISOString() : undefined,
    })
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to create interaction'
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
    <form class="w-[32rem] p-6" @submit.prevent="handleSubmit">
      <h3 class="text-lg font-semibold text-gray-900">Log Interaction</h3>

      <div v-if="error" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

      <div class="mt-4 space-y-4">
        <!-- Contact -->
        <div v-if="!props.contactId">
          <label class="block text-sm font-medium text-gray-700">Contact *</label>
          <select
            v-model.number="contactId"
            required
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option :value="undefined" disabled>Select a contact…</option>
            <option v-for="c in contactsStore.items" :key="c.id" :value="c.id">
              {{ c.name }} — {{ c.outlet }}
            </option>
          </select>
        </div>

        <!-- Campaign (optional) -->
        <div v-if="!props.campaignId">
          <label class="block text-sm font-medium text-gray-700">Campaign (optional)</label>
          <select
            v-model.number="campaignId"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option :value="undefined">None</option>
            <option v-for="c in campaignsStore.items" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Direction + Channel -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Direction</label>
            <div class="mt-1 flex gap-2">
              <label
                v-for="d in directions"
                :key="d"
                :class="[
                  'cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  direction === d
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                ]"
              >
                <input v-model="direction" type="radio" :value="d" class="sr-only" />
                {{ d }}
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Channel</label>
            <div class="mt-1 flex gap-2">
              <label
                v-for="ch in channels"
                :key="ch"
                :class="[
                  'cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  channel === ch
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                ]"
              >
                <input v-model="channel" type="radio" :value="ch" class="sr-only" />
                {{ ch }}
              </label>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <select
            v-model="status"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option v-for="s in statuses" :key="s" :value="s">
              {{ s.charAt(0).toUpperCase() + s.slice(1) }}
            </option>
          </select>
        </div>

        <!-- Subject -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Subject</label>
          <input
            v-model="subject"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <!-- Content -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Content *</label>
          <textarea
            v-model="content"
            required
            rows="4"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <!-- Occurred At -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Occurred At</label>
          <input
            v-model="occurredAt"
            type="datetime-local"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
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
          {{ submitting ? 'Saving…' : 'Log Interaction' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
