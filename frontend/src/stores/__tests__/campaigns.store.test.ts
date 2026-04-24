import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCampaignsStore } from '../campaigns.store'

vi.mock('@/api/campaigns.api', () => ({
  listCampaigns: vi.fn(),
  getCampaign: vi.fn(),
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  addContactsToCampaign: vi.fn(),
  removeContactFromCampaign: vi.fn(),
  getCampaignParticipants: vi.fn(),
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({ notify: vi.fn() }),
}))

describe('CampaignsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should start with empty state', () => {
    const store = useCampaignsStore()
    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
    expect(store.current).toBeNull()
    expect(store.participants).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('fetchList should populate items and total', async () => {
    const api = await import('@/api/campaigns.api')
    vi.mocked(api.listCampaigns).mockResolvedValue({
      data: [{ id: 1, name: 'Campaign A', description: '', objective: '', status: 'draft', archivedAt: null, createdAt: '', updatedAt: '' }],
      total: 1,
    })

    const store = useCampaignsStore()
    await store.fetchList()

    expect(api.listCampaigns).toHaveBeenCalledWith(50, 0)
    expect(store.items).toHaveLength(1)
    expect(store.total).toBe(1)
  })

  it('fetchList should set error on failure', async () => {
    const api = await import('@/api/campaigns.api')
    vi.mocked(api.listCampaigns).mockRejectedValue(new Error('Network error'))

    const store = useCampaignsStore()
    await store.fetchList()

    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('fetchOne should set current campaign', async () => {
    const api = await import('@/api/campaigns.api')
    const campaign = { id: 1, name: 'Test', description: 'd', objective: 'o', status: 'draft' as const, archivedAt: null, createdAt: '', updatedAt: '' }
    vi.mocked(api.getCampaign).mockResolvedValue(campaign)

    const store = useCampaignsStore()
    await store.fetchOne(1)

    expect(store.current).toEqual(campaign)
  })

  it('create should call API, notify, and refresh list', async () => {
    const api = await import('@/api/campaigns.api')
    const created = { id: 2, name: 'New', description: '', objective: '', status: 'draft' as const, archivedAt: null, createdAt: '', updatedAt: '' }
    vi.mocked(api.createCampaign).mockResolvedValue(created)
    vi.mocked(api.listCampaigns).mockResolvedValue({ data: [created], total: 1 })

    const store = useCampaignsStore()
    const result = await store.create({ name: 'New', description: '', objective: '' })

    expect(api.createCampaign).toHaveBeenCalledWith({ name: 'New', description: '', objective: '' })
    expect(result.id).toBe(2)
    expect(api.listCampaigns).toHaveBeenCalled()
  })

  it('update should update current if matching and refresh', async () => {
    const api = await import('@/api/campaigns.api')
    const updated = { id: 1, name: 'Updated', description: '', objective: '', status: 'active' as const, archivedAt: null, createdAt: '', updatedAt: '' }
    vi.mocked(api.updateCampaign).mockResolvedValue(updated)
    vi.mocked(api.listCampaigns).mockResolvedValue({ data: [updated], total: 1 })

    const store = useCampaignsStore()
    store.current = { id: 1, name: 'Old', description: '', objective: '', status: 'draft', archivedAt: null, createdAt: '', updatedAt: '' }

    const result = await store.update(1, { name: 'Updated', status: 'active' })

    expect(result.name).toBe('Updated')
    expect(store.current?.status).toBe('active')
  })

  it('archive should clear current if matching and refresh', async () => {
    const api = await import('@/api/campaigns.api')
    vi.mocked(api.deleteCampaign).mockResolvedValue(undefined)
    vi.mocked(api.listCampaigns).mockResolvedValue({ data: [], total: 0 })

    const store = useCampaignsStore()
    store.current = { id: 3, name: 'X', description: '', objective: '', status: 'draft', archivedAt: null, createdAt: '', updatedAt: '' }

    await store.archive(3)

    expect(api.deleteCampaign).toHaveBeenCalledWith(3)
    expect(store.current).toBeNull()
  })

  it('fetchParticipants should populate participants', async () => {
    const api = await import('@/api/campaigns.api')
    vi.mocked(api.getCampaignParticipants).mockResolvedValue([
      { contactId: 1, contactName: 'Alice', outlet: 'CNN', email: 'a@t.com', status: 'active', addedAt: '' },
    ])

    const store = useCampaignsStore()
    await store.fetchParticipants(10)

    expect(api.getCampaignParticipants).toHaveBeenCalledWith(10)
    expect(store.participants).toHaveLength(1)
  })

  it('addContacts should call API and refresh participants', async () => {
    const api = await import('@/api/campaigns.api')
    vi.mocked(api.addContactsToCampaign).mockResolvedValue({ added: 2 })
    vi.mocked(api.getCampaignParticipants).mockResolvedValue([])

    const store = useCampaignsStore()
    const result = await store.addContacts(5, [1, 2])

    expect(api.addContactsToCampaign).toHaveBeenCalledWith(5, { contactIds: [1, 2] })
    expect(result.added).toBe(2)
  })

  it('removeContact should call API and refresh participants', async () => {
    const api = await import('@/api/campaigns.api')
    vi.mocked(api.removeContactFromCampaign).mockResolvedValue(undefined)
    vi.mocked(api.getCampaignParticipants).mockResolvedValue([])

    const store = useCampaignsStore()
    await store.removeContact(5, 1)

    expect(api.removeContactFromCampaign).toHaveBeenCalledWith(5, 1)
  })

  it('clearCurrent should reset current and participants', () => {
    const store = useCampaignsStore()
    store.current = { id: 1 } as any
    store.participants = [{ contactId: 1 }] as any
    store.clearCurrent()
    expect(store.current).toBeNull()
    expect(store.participants).toEqual([])
  })
})
