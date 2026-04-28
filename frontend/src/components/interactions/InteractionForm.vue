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
    class="rounded-2xl bg-[var(--color-surface)] p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    @cancel.prevent="emit('close')"
  >
    <form class="w-[34rem]" @submit.prevent="handleSubmit">
      <div class="flex items-center justify-between border-b border-[var(--color-border)] px-6 pt-6 pb-4">
        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Log Interaction</h3>
        <button type="button" class="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]" @click="emit('close')">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
        <div v-if="error" class="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
          {{ error }}
        </div>

        <div class="space-y-5">
          <!-- Contact -->
          <div v-if="!props.contactId">
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Contact *</label>
            <select
              v-model.number="contactId"
              required
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            >
              <option :value="undefined" disabled>Select a contact…</option>
              <option v-for="c in contactsStore.items" :key="c.id" :value="c.id">
                {{ c.name }} — {{ c.outlet }}
              </option>
            </select>
          </div>

          <!-- Campaign (optional) -->
          <div v-if="!props.campaignId">
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Campaign (optional)</label>
            <select
              v-model.number="campaignId"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            >
              <option :value="undefined">None</option>
              <option v-for="c in campaignsStore.items" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Direction + Channel -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Direction</label>
              <div class="flex gap-2">
                <label
                  v-for="d in directions"
                  :key="d"
                  :class="[
                    'cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors',
                    direction === d
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
                  ]"
                >
                  <input v-model="direction" type="radio" :value="d" class="sr-only" />
                  {{ d }}
                </label>
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Channel</label>
              <div class="flex gap-2">
                <label
                  v-for="ch in channels"
                  :key="ch"
                  :class="[
                    'cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors',
                    channel === ch
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
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
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Status</label>
            <select
              v-model="status"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            >
              <option v-for="s in statuses" :key="s" :value="s">
                {{ s.charAt(0).toUpperCase() + s.slice(1) }}
              </option>
            </select>
          </div>

          <!-- Subject -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Subject</label>
            <input
              v-model="subject"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <!-- Content -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Content *</label>
            <textarea
              v-model="content"
              required
              rows="4"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <!-- Occurred At -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Occurred At</label>
            <input
              v-model="occurredAt"
              type="datetime-local"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
        <button
          type="button"
          class="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : 'Log Interaction' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
