import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ContactListItemDTO,
  ContactResponseDTO,
  CreateContactDTO,
  UpdateContactDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'
import * as contactsApi from '@/api/contacts.api'
import { useNotifications } from '@/composables/useNotifications'

export const useContactsStore = defineStore('contacts', () => {
  const items = ref<ContactListItemDTO[]>([])
  const total = ref(0)
  const current = ref<ContactResponseDTO | null>(null)
  const loading = ref(false)
  const error = ref('')
  const { notify } = useNotifications()

  async function fetchList(limit = 50, offset = 0): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res: PaginatedResult<ContactListItemDTO> = await contactsApi.listContacts(limit, offset)
      items.value = res.data
      total.value = res.total
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load contacts'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      current.value = await contactsApi.getContact(id)
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load contact'
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateContactDTO): Promise<ContactResponseDTO> {
    const result = await contactsApi.createContact(dto)
    notify({ type: 'success', message: 'Contact created' })
    await fetchList()
    return result
  }

  async function update(id: number, dto: UpdateContactDTO): Promise<ContactResponseDTO> {
    const result = await contactsApi.updateContact(id, dto)
    if (current.value?.id === id) current.value = result
    notify({ type: 'success', message: 'Contact updated' })
    await fetchList()
    return result
  }

  async function archive(id: number): Promise<void> {
    await contactsApi.deleteContact(id)
    if (current.value?.id === id) current.value = null
    notify({ type: 'success', message: 'Contact archived' })
    await fetchList()
  }

  function clearCurrent(): void {
    current.value = null
  }

  return { items, total, current, loading, error, fetchList, fetchOne, create, update, archive, clearCurrent }
})
