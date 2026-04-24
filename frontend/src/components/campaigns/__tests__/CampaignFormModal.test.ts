import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CampaignFormModal from '../CampaignFormModal.vue'

const createMock = vi.fn()
const updateMock = vi.fn()

vi.mock('@/stores/campaigns.store', () => ({
  useCampaignsStore: () => ({
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
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()

  return mount(CampaignFormModal, {
    props: { open: true, campaign: null, ...props },
    global: { plugins: [pinia] },
  })
}

describe('CampaignFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "New Campaign" title when no campaign prop', async () => {
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.find('h3').text()).toBe('New Campaign')
  })

  it('renders "Edit Campaign" title when campaign prop is provided', async () => {
    const wrapper = mountModal({
      open: false,
      campaign: { id: 1, name: 'Camp', description: 'desc', objective: 'obj', status: 'draft', archivedAt: null, createdAt: '', updatedAt: '' },
    })
    await wrapper.setProps({ open: true })
    expect(wrapper.find('h3').text()).toBe('Edit Campaign')
  })

  it('shows status dropdown only in edit mode', async () => {
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.find('select').exists()).toBe(false)

    const editWrapper = mountModal({
      open: false,
      campaign: { id: 1, name: 'C', description: 'd', objective: 'o', status: 'active', archivedAt: null, createdAt: '', updatedAt: '' },
    })
    await editWrapper.setProps({ open: true })
    expect(editWrapper.find('select').exists()).toBe(true)
  })

  it('calls store.create on submit for new campaign', async () => {
    createMock.mockResolvedValue({ id: 1 })
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    const textareas = wrapper.findAll('textarea')
    await inputs[0].setValue('New Campaign')
    await textareas[0].setValue('Description here')
    await textareas[1].setValue('Objective here')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createMock).toHaveBeenCalledWith({
      name: 'New Campaign',
      description: 'Description here',
      objective: 'Objective here',
    })
  })

  it('calls store.update on submit for existing campaign', async () => {
    updateMock.mockResolvedValue({ id: 1 })
    const wrapper = mountModal({
      open: false,
      campaign: { id: 1, name: 'Old', description: 'old desc', objective: 'old obj', status: 'draft', archivedAt: null, createdAt: '', updatedAt: '' },
    })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Updated Name')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateMock).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Updated Name',
      status: 'draft',
    }))
  })

  it('emits saved and close on success', async () => {
    createMock.mockResolvedValue({ id: 1 })
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    const textareas = wrapper.findAll('textarea')
    await inputs[0].setValue('Name')
    await textareas[0].setValue('Desc')
    await textareas[1].setValue('Obj')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows error when save fails', async () => {
    const { ApiError } = await import('@/api/client')
    createMock.mockRejectedValue(new ApiError('Name required', 400))
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })

    const inputs = wrapper.findAll('input')
    const textareas = wrapper.findAll('textarea')
    await inputs[0].setValue('X')
    await textareas[0].setValue('D')
    await textareas[1].setValue('O')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Name required')
  })

  it('emits close when cancel is clicked', async () => {
    const wrapper = mountModal({ open: false })
    await wrapper.setProps({ open: true })
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')!
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
