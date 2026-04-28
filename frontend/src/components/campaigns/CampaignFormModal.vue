<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { CampaignResponseDTO, CampaignStatus } from '@pr-outreach/shared-types'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { ApiError } from '@/api/client'

const props = defineProps<{
  open: boolean
  campaign?: CampaignResponseDTO | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const store = useCampaignsStore()
const dialogRef = ref<HTMLDialogElement | null>(null)
const submitting = ref(false)
const error = ref('')

const name = ref('')
const description = ref('')
const objective = ref('')
const status = ref<CampaignStatus>('draft')

const isEdit = computed(() => !!props.campaign)
const title = computed(() => (isEdit.value ? 'Edit Campaign' : 'New Campaign'))

const statusOptions: CampaignStatus[] = ['draft', 'active', 'paused', 'completed']

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      error.value = ''
      if (props.campaign) {
        name.value = props.campaign.name
        description.value = props.campaign.description
        objective.value = props.campaign.objective
        status.value = props.campaign.status
      } else {
        name.value = ''
        description.value = ''
        objective.value = ''
        status.value = 'draft'
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
  try {
    if (isEdit.value && props.campaign) {
      await store.update(props.campaign.id, {
        name: name.value,
        description: description.value,
        objective: objective.value,
        status: status.value,
      })
    } else {
      await store.create({
        name: name.value,
        description: description.value,
        objective: objective.value,
      })
    }
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to save campaign'
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
    <form class="w-[30rem]" @submit.prevent="handleSubmit">
      <div class="flex items-center justify-between border-b border-[var(--color-border)] px-6 pt-6 pb-4">
        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{{ title }}</h3>
        <button type="button" class="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]" @click="emit('close')">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="px-6 py-5">
        <div v-if="error" class="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
          {{ error }}
        </div>

        <div class="space-y-5">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Name *</label>
            <input
              v-model="name"
              required
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Description *</label>
            <textarea
              v-model="description"
              required
              rows="3"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Objective *</label>
            <textarea
              v-model="objective"
              required
              rows="2"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div v-if="isEdit">
            <label class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Status</label>
            <select
              v-model="status"
              class="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            >
              <option v-for="s in statusOptions" :key="s" :value="s">
                {{ s.charAt(0).toUpperCase() + s.slice(1) }}
              </option>
            </select>
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
          {{ submitting ? 'Saving…' : isEdit ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
