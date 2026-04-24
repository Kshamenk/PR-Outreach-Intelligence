import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContactFormModal from '../ContactFormModal.vue'

const createMock = vi.fn()
const updateMock = vi.fn()

vi.mock('@/stores/contacts.store', () => ({
  useContactsStore: () => ({
    create: createMock,
    update: updateMock,
  }),
}))

vi.mock('@/api/client', () => {
  class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }
  return { ApiError }
})

function mountModal(props: Record<string, any> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  // Stub dialog showModal/close since jsdom doesn't support <dialog>
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()

  return mount(ContactFormModal, {
    props: { open: true, contact: null, ...props },
    global: { plugins: [pinia] },
  })
}

describe('ContactFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "New Contact" title when no contact prop', async () => {
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.find('h3').text()).toBe('New Contact')
  })

  it('renders "Edit Contact" title when contact prop is provided', async () => {
    const wrapper = mountModal({
      open: false,
      contact: { id: 1, name: 'Alice', email: 'a@b.com', outlet: 'CNN', topics: ['tech'], relationshipScore: 0, createdAt: '', updatedAt: '', archivedAt: null },
    })
    await wrapper.setProps({ open: true })
    expect(wrapper.find('h3').text()).toBe('Edit Contact')
  })

  it('pre-fills form fields in edit mode', async () => {
    const wrapper = mountModal({
      open: false,
      contact: { id: 1, name: 'Alice', email: 'a@b.com', outlet: 'CNN', topics: ['tech', 'AI'], relationshipScore: 0, createdAt: '', updatedAt: '', archivedAt: null },
    })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    // name, email, outlet, topics
    expect((inputs[0].element as HTMLInputElement).value).toBe('Alice')
    expect((inputs[1].element as HTMLInputElement).value).toBe('a@b.com')
    expect((inputs[2].element as HTMLInputElement).value).toBe('CNN')
    expect((inputs[3].element as HTMLInputElement).value).toBe('tech, AI')
  })

  it('calls store.create on submit for new contact', async () => {
    createMock.mockResolvedValue({ id: 1 })
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Bob')
    await inputs[1].setValue('bob@news.com')
    await inputs[2].setValue('Reuters')
    await inputs[3].setValue('politics, economy')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createMock).toHaveBeenCalledWith({
      name: 'Bob',
      email: 'bob@news.com',
      outlet: 'Reuters',
      topics: ['politics', 'economy'],
    })
  })

  it('calls store.update on submit for existing contact', async () => {
    updateMock.mockResolvedValue({ id: 1 })
    const wrapper = mountModal({
      open: false,
      contact: { id: 1, name: 'Alice', email: 'a@b.com', outlet: 'CNN', topics: ['tech'], relationshipScore: 0, createdAt: '', updatedAt: '', archivedAt: null },
    })
    await wrapper.setProps({ open: true })

    const nameInput = wrapper.findAll('input')[0]
    await nameInput.setValue('Alice Updated')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateMock).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Alice Updated' }))
  })

  it('emits saved and close on successful save', async () => {
    createMock.mockResolvedValue({ id: 1 })
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Test')
    await inputs[1].setValue('t@t.com')
    await inputs[2].setValue('Outlet')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows error when save fails', async () => {
    const { ApiError } = await import('@/api/client')
    createMock.mockRejectedValue(new ApiError('Duplicate email', 409))
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Test')
    await inputs[1].setValue('dup@t.com')
    await inputs[2].setValue('Outlet')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Duplicate email')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('emits close when cancel button is clicked', async () => {
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')!
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
