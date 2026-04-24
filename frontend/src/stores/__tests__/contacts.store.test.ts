import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useContactsStore } from '../contacts.store'

vi.mock('@/api/contacts.api', () => ({
  listContacts: vi.fn(),
  getContact: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({ notify: vi.fn() }),
}))

describe('ContactsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should start with empty state', () => {
    const store = useContactsStore()
    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('fetchList should populate items and total', async () => {
    const api = await import('@/api/contacts.api')
    vi.mocked(api.listContacts).mockResolvedValue({
      data: [
        { id: 1, name: 'Alice', email: 'a@t.com', outlet: 'CNN', score: 10, archivedAt: null },
        { id: 2, name: 'Bob', email: 'b@t.com', outlet: 'BBC', score: 20, archivedAt: null },
      ],
      total: 2,
    })

    const store = useContactsStore()
    await store.fetchList()

    expect(api.listContacts).toHaveBeenCalledWith(50, 0)
    expect(store.items).toHaveLength(2)
    expect(store.total).toBe(2)
    expect(store.loading).toBe(false)
  })

  it('fetchList should set error on failure', async () => {
    const api = await import('@/api/contacts.api')
    vi.mocked(api.listContacts).mockRejectedValue(new Error('Network error'))

    const store = useContactsStore()
    await store.fetchList()

    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('fetchOne should set current contact', async () => {
    const api = await import('@/api/contacts.api')
    const contact = { id: 1, name: 'Alice', email: 'a@t.com', outlet: 'CNN', topics: ['tech'], score: 10, archivedAt: null, createdAt: '', updatedAt: '', lastContactedAt: null }
    vi.mocked(api.getContact).mockResolvedValue(contact)

    const store = useContactsStore()
    await store.fetchOne(1)

    expect(api.getContact).toHaveBeenCalledWith(1)
    expect(store.current).toEqual(contact)
  })

  it('create should call API, notify, and refresh list', async () => {
    const api = await import('@/api/contacts.api')
    const created = { id: 3, name: 'New', email: 'n@t.com', outlet: '', topics: [], score: 0, archivedAt: null, createdAt: '', updatedAt: '', lastContactedAt: null }
    vi.mocked(api.createContact).mockResolvedValue(created)
    vi.mocked(api.listContacts).mockResolvedValue({ data: [created], total: 1 })

    const store = useContactsStore()
    const result = await store.create({ name: 'New', email: 'n@t.com', outlet: '', topics: [] })

    expect(api.createContact).toHaveBeenCalledWith({ name: 'New', email: 'n@t.com', outlet: '', topics: [] })
    expect(result.id).toBe(3)
    expect(api.listContacts).toHaveBeenCalled()
  })

  it('update should call API, update current if matching, and refresh list', async () => {
    const api = await import('@/api/contacts.api')
    const updated = { id: 1, name: 'Updated', email: 'a@t.com', outlet: 'CNN', topics: [], score: 10, archivedAt: null, createdAt: '', updatedAt: '', lastContactedAt: null }
    vi.mocked(api.updateContact).mockResolvedValue(updated)
    vi.mocked(api.listContacts).mockResolvedValue({ data: [updated], total: 1 })

    const store = useContactsStore()
    store.current = { id: 1, name: 'Old', email: 'a@t.com', outlet: 'CNN', topics: [], score: 10, archivedAt: null, createdAt: '', updatedAt: '', lastContactedAt: null }

    const result = await store.update(1, { name: 'Updated' })

    expect(result.name).toBe('Updated')
    expect(store.current?.name).toBe('Updated')
    expect(api.listContacts).toHaveBeenCalled()
  })

  it('archive should call delete, clear current if matching, and refresh list', async () => {
    const api = await import('@/api/contacts.api')
    vi.mocked(api.deleteContact).mockResolvedValue(undefined)
    vi.mocked(api.listContacts).mockResolvedValue({ data: [], total: 0 })

    const store = useContactsStore()
    store.current = { id: 5, name: 'X', email: 'x@t.com', outlet: '', topics: [], score: 0, archivedAt: null, createdAt: '', updatedAt: '', lastContactedAt: null }

    await store.archive(5)

    expect(api.deleteContact).toHaveBeenCalledWith(5)
    expect(store.current).toBeNull()
    expect(api.listContacts).toHaveBeenCalled()
  })

  it('clearCurrent should reset current to null', () => {
    const store = useContactsStore()
    store.current = { id: 1 } as any
    store.clearCurrent()
    expect(store.current).toBeNull()
  })
})
