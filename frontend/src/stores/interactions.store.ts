import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  InteractionResponseDTO,
  CreateInteractionDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'
import * as interactionsApi from '@/api/interactions.api'
import { useNotifications } from '@/composables/useNotifications'

export const useInteractionsStore = defineStore('interactions', () => {
  const items = ref<InteractionResponseDTO[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  const { notify } = useNotifications()

  async function fetchList(
    params: { contactId?: number; campaignId?: number; limit?: number; offset?: number } = {},
  ): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res: PaginatedResult<InteractionResponseDTO> = await interactionsApi.listInteractions(params)
      items.value = res.data
      total.value = res.total
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load interactions'
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateInteractionDTO): Promise<InteractionResponseDTO> {
    const result = await interactionsApi.createInteraction(dto)
    notify({ type: 'success', message: 'Interaction logged' })
    return result
  }

  function clearList(): void {
    items.value = []
    total.value = 0
  }

  return { items, total, loading, error, fetchList, create, clearList }
})
