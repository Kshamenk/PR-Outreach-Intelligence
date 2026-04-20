import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  CampaignResponseDTO,
  CampaignParticipantDTO,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  AddContactsToCampaignDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'
import * as campaignsApi from '@/api/campaigns.api'
import { useNotifications } from '@/composables/useNotifications'

export const useCampaignsStore = defineStore('campaigns', () => {
  const items = ref<CampaignResponseDTO[]>([])
  const total = ref(0)
  const current = ref<CampaignResponseDTO | null>(null)
  const participants = ref<CampaignParticipantDTO[]>([])
  const loading = ref(false)
  const error = ref('')
  const { notify } = useNotifications()

  async function fetchList(limit = 50, offset = 0): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res: PaginatedResult<CampaignResponseDTO> = await campaignsApi.listCampaigns(limit, offset)
      items.value = res.data
      total.value = res.total
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load campaigns'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      current.value = await campaignsApi.getCampaign(id)
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load campaign'
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateCampaignDTO): Promise<CampaignResponseDTO> {
    const result = await campaignsApi.createCampaign(dto)
    notify({ type: 'success', message: 'Campaign created' })
    await fetchList()
    return result
  }

  async function update(id: number, dto: UpdateCampaignDTO): Promise<CampaignResponseDTO> {
    const result = await campaignsApi.updateCampaign(id, dto)
    if (current.value?.id === id) current.value = result
    notify({ type: 'success', message: 'Campaign updated' })
    await fetchList()
    return result
  }

  async function archive(id: number): Promise<void> {
    await campaignsApi.deleteCampaign(id)
    if (current.value?.id === id) current.value = null
    notify({ type: 'success', message: 'Campaign archived' })
    await fetchList()
  }

  async function fetchParticipants(campaignId: number): Promise<void> {
    try {
      participants.value = await campaignsApi.getCampaignParticipants(campaignId)
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load participants'
    }
  }

  async function addContacts(campaignId: number, contactIds: number[]): Promise<{ added: number }> {
    const dto: AddContactsToCampaignDTO = { contactIds }
    const result = await campaignsApi.addContactsToCampaign(campaignId, dto)
    await fetchParticipants(campaignId)
    return result
  }

  async function removeContact(campaignId: number, contactId: number): Promise<void> {
    await campaignsApi.removeContactFromCampaign(campaignId, contactId)
    await fetchParticipants(campaignId)
  }

  function clearCurrent(): void {
    current.value = null
    participants.value = []
  }

  return {
    items, total, current, participants, loading, error,
    fetchList, fetchOne, create, update, archive,
    fetchParticipants, addContacts, removeContact, clearCurrent,
  }
})
