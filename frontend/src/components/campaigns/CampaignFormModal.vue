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
          <label class="block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            v-model="description"
            required
            rows="3"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Objective *</label>
          <textarea
            v-model="objective"
            required
            rows="2"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div v-if="isEdit">
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <select
            v-model="status"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option v-for="s in statusOptions" :key="s" :value="s">
              {{ s.charAt(0).toUpperCase() + s.slice(1) }}
            </option>
          </select>
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
