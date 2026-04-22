import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotifications } from '../useNotifications'

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear previous notifications between tests
    const { items, remove } = useNotifications()
    items.value.forEach((n) => remove(n.id))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add a notification', () => {
    const { items, notify } = useNotifications()
    notify({ type: 'success', message: 'Test success' })
    expect(items.value).toHaveLength(1)
    expect(items.value[0].message).toBe('Test success')
    expect(items.value[0].type).toBe('success')
  })

  it('should remove a notification by id', () => {
    const { items, notify, remove } = useNotifications()
    notify({ type: 'info', message: 'To remove' })
    const id = items.value[0].id
    remove(id)
    expect(items.value).toHaveLength(0)
  })

  it('should auto-dismiss success after 4s', () => {
    const { items, notify } = useNotifications()
    notify({ type: 'success', message: 'Auto dismiss' })
    expect(items.value).toHaveLength(1)

    vi.advanceTimersByTime(4001)
    expect(items.value).toHaveLength(0)
  })

  it('should auto-dismiss error after 8s', () => {
    const { items, notify } = useNotifications()
    notify({ type: 'error', message: 'Error msg' })

    vi.advanceTimersByTime(4001)
    expect(items.value).toHaveLength(1) // still there at 4s

    vi.advanceTimersByTime(4001)
    expect(items.value).toHaveLength(0) // gone after 8s
  })

  it('should cap at MAX_VISIBLE (5) and remove oldest', () => {
    const { items, notify } = useNotifications()
    for (let i = 0; i < 6; i++) {
      notify({ type: 'info', message: `Msg ${i}` })
    }
    expect(items.value.length).toBeLessThanOrEqual(5)
    // First message should have been dropped
    expect(items.value.find((n) => n.message === 'Msg 0')).toBeUndefined()
    expect(items.value.find((n) => n.message === 'Msg 5')).toBeDefined()
  })
})
