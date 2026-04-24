import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInteractionsStore } from '../interactions.store'

vi.mock('@/api/interactions.api', () => ({
  listInteractions: vi.fn(),
  createInteraction: vi.fn(),
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({ notify: vi.fn() }),
}))

describe('InteractionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should start with empty state', () => {
    const store = useInteractionsStore()
    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('fetchList should populate items with contactId filter', async () => {
    const api = await import('@/api/interactions.api')
    vi.mocked(api.listInteractions).mockResolvedValue({
      data: [{ id: 1, contactId: 1, campaignId: null, direction: 'outbound', channel: 'email', status: 'sent', subject: 'Hi', content: 'Hello', occurredAt: '', createdAt: '' }],
      total: 1,
    })

    const store = useInteractionsStore()
    await store.fetchList({ contactId: 1 })

    expect(api.listInteractions).toHaveBeenCalledWith({ contactId: 1 })
    expect(store.items).toHaveLength(1)
    expect(store.total).toBe(1)
    expect(store.loading).toBe(false)
  })

  it('fetchList should use default empty params', async () => {
    const api = await import('@/api/interactions.api')
    vi.mocked(api.listInteractions).mockResolvedValue({ data: [], total: 0 })

    const store = useInteractionsStore()
    await store.fetchList()

    expect(api.listInteractions).toHaveBeenCalledWith({})
  })

  it('fetchList should set error on failure', async () => {
    const api = await import('@/api/interactions.api')
    vi.mocked(api.listInteractions).mockRejectedValue(new Error('Network error'))

    const store = useInteractionsStore()
    await store.fetchList()

    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('create should call API and notify', async () => {
    const api = await import('@/api/interactions.api')
    const created = { id: 5, contactId: 1, campaignId: 2, direction: 'outbound' as const, channel: 'email' as const, status: 'sent' as const, subject: 'Press', content: 'Hello', occurredAt: '', createdAt: '' }
    vi.mocked(api.createInteraction).mockResolvedValue(created)

    const store = useInteractionsStore()
    const result = await store.create({
      contactId: 1,
      direction: 'outbound',
      channel: 'email',
      status: 'sent',
      content: 'Hello',
    })

    expect(api.createInteraction).toHaveBeenCalled()
    expect(result.id).toBe(5)
  })

  it('clearList should reset items and total', () => {
    const store = useInteractionsStore()
    store.items = [{ id: 1 }] as any
    store.total = 1
    store.clearList()
    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
  })
})
