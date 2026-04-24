import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import InteractionForm from '../InteractionForm.vue'

const createInteractionMock = vi.fn()

vi.mock('@/stores/interactions.store', () => ({
  useInteractionsStore: () => ({
    create: createInteractionMock,
  }),
}))

vi.mock('@/stores/contacts.store', () => ({
  useContactsStore: () => ({
    items: [
      { id: 1, name: 'Alice', outlet: 'CNN' },
      { id: 2, name: 'Bob', outlet: 'BBC' },
    ],
    fetchList: vi.fn(),
  }),
}))

vi.mock('@/stores/campaigns.store', () => ({
  useCampaignsStore: () => ({
    items: [
      { id: 10, name: 'Tech Launch' },
    ],
    fetchList: vi.fn(),
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

function mountForm(props: Record<string, any> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()

  return mount(InteractionForm, {
    props: { open: true, ...props },
    global: { plugins: [pinia] },
  })
}

describe('InteractionForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the "Log Interaction" title', async () => {
    const wrapper = mountForm({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.find('h3').text()).toBe('Log Interaction')
  })

  it('shows contact dropdown when no contactId prop', async () => {
    const wrapper = mountForm({ open: false })
    await wrapper.setProps({ open: true })
    const selects = wrapper.findAll('select')
    // Contact + Campaign + Status = 3 selects
    expect(selects.length).toBeGreaterThanOrEqual(2)
    // First select should have contact options
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })

  it('hides contact dropdown when contactId prop is provided', async () => {
    const wrapper = mountForm({ open: false, contactId: 1 })
    await wrapper.setProps({ open: true })
    // Should not render the "Select a contact…" option
    expect(wrapper.text()).not.toContain('Select a contact')
  })

  it('renders direction radio buttons', async () => {
    const wrapper = mountForm({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.text()).toContain('outbound')
    expect(wrapper.text()).toContain('inbound')
    expect(wrapper.text()).toContain('internal')
  })

  it('renders channel radio buttons', async () => {
    const wrapper = mountForm({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.text()).toContain('email')
    expect(wrapper.text()).toContain('note')
  })

  it('calls store.create on submit with contactId prop', async () => {
    createInteractionMock.mockResolvedValue({ id: 1 })
    const wrapper = mountForm({ open: false, contactId: 5 })
    await wrapper.setProps({ open: true })

    await wrapper.find('textarea').setValue('Hello press')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createInteractionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 5,
        direction: 'outbound',
        channel: 'email',
        status: 'sent',
        content: 'Hello press',
      }),
    )
  })

  it('emits saved and close on successful creation', async () => {
    createInteractionMock.mockResolvedValue({ id: 1 })
    const wrapper = mountForm({ open: false, contactId: 5 })
    await wrapper.setProps({ open: true })

    await wrapper.find('textarea').setValue('Content')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows error on create failure', async () => {
    const { ApiError } = await import('@/api/client')
    createInteractionMock.mockRejectedValue(new ApiError('Contact archived', 400))
    const wrapper = mountForm({ open: false, contactId: 5 })
    await wrapper.setProps({ open: true })

    await wrapper.find('textarea').setValue('Content')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Contact archived')
  })

  it('emits close on cancel click', async () => {
    const wrapper = mountForm({ open: false })
    await wrapper.setProps({ open: true })
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')!
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
