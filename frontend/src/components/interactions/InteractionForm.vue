<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { InteractionDirection, InteractionChannel, InteractionStatus } from '@pr-outreach/shared-types'
import { useInteractionsStore } from '@/stores/interactions.store'
import { useContactsStore } from '@/stores/contacts.store'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { ApiError } from '@/api/client'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { SelectOption } from '@/components/ui/AppSelect.vue'

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
const contactError = ref('')

const contactId = ref<number | undefined>(undefined)
const campaignId = ref<number | undefined>(undefined)
const direction = ref<InteractionDirection>('outbound')
const channel = ref<InteractionChannel>('email')
const status = ref<InteractionStatus>('sent')
const subject = ref('')
const content = ref('')
const occurredAt = ref('')

const occurredDate = computed({
  get: () => occurredAt.value.slice(0, 10),
  set: (v: string) => { occurredAt.value = v + 'T' + occurredTime.value },
})
const occurredTime = computed({
  get: () => occurredAt.value.slice(11, 16) || '00:00',
  set: (v: string) => { occurredAt.value = occurredDate.value + 'T' + v },
})

const directions: InteractionDirection[] = ['outbound', 'inbound', 'internal']
const channels: InteractionChannel[] = ['email', 'note']
const statuses: InteractionStatus[] = ['draft', 'sent', 'delivered', 'failed', 'replied', 'archived']

const contactSelectOptions = computed<SelectOption[]>(() => [
  { value: undefined, label: 'Select a contact…', disabled: true },
  ...contactsStore.items.map((c) => ({ value: c.id, label: `${c.name} — ${c.outlet}` })),
])
const campaignSelectOptions = computed<SelectOption[]>(() => [
  { value: undefined, label: 'None' },
  ...campaignsStore.items.map((c) => ({ value: c.id, label: c.name })),
])
const statusSelectOptions = computed<SelectOption[]>(() =>
  statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
)

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
    contactError.value = 'Please select a contact'
    return
  }

  contactError.value = ''
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
    class="mx-4 w-full max-w-[34rem] rounded-2xl bg-[var(--color-surface)] p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    @cancel.prevent="emit('close')"
  >
    <form @submit.prevent="handleSubmit">
      <div class="flex items-center justify-between border-b border-[var(--color-border)] px-6 pt-6 pb-4">
        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Log Interaction</h3>
        <button type="button" class="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]" @click="emit('close')">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="max-h-[65vh] overflow-y-auto px-6 py-5">
        <div v-if="error" class="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
          {{ error }}
        </div>

        <div class="space-y-5">
          <!-- Contact -->
          <div v-if="!props.contactId">
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Contact *</label>
            <AppSelect
              :model-value="contactId"
              :options="contactSelectOptions"
              :required="true"
              placeholder="Select a contact…"
              variant="modal"
              @update:model-value="contactId = $event as number | undefined; contactError = ''"
            />
            <p v-if="contactError" class="mt-1 text-xs text-[var(--color-danger)]">{{ contactError }}</p>
          </div>

          <!-- Campaign (optional) -->
          <div v-if="!props.campaignId">
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Campaign (optional)</label>
            <AppSelect
              :model-value="campaignId"
              :options="campaignSelectOptions"
              placeholder="None"
              variant="modal"
              @update:model-value="campaignId = $event as number | undefined"
            />
          </div>

          <!-- Direction + Channel -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Direction</label>
              <div class="flex flex-wrap gap-2">
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
              <div class="flex flex-wrap gap-2">
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
            <AppSelect
              :model-value="status"
              :options="statusSelectOptions"
              variant="modal"
              @update:model-value="status = $event as InteractionStatus"
            />
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
            <!-- Desktop: single datetime-local -->
            <input
              v-model="occurredAt"
              type="datetime-local"
              class="hidden md:block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
            <!-- Mobile: split date + time (smaller native pickers) -->
            <div class="flex gap-2 md:hidden">
              <input
                v-model="occurredDate"
                type="date"
                class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
              />
              <input
                v-model="occurredTime"
                type="time"
                class="block w-24 shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
              />
            </div>
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
