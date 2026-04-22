import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatDate } from '../date'

describe('formatDate', () => {
  it('should format ISO date to en-US short format', () => {
    const result = formatDate('2026-04-22T10:00:00.000Z')
    // toLocaleDateString('en-US', { year, month: 'short', day }) → "Apr 22, 2026"
    expect(result).toContain('Apr')
    expect(result).toContain('22')
    expect(result).toContain('2026')
  })

  it('should handle different dates', () => {
    const result = formatDate('2025-12-25T00:00:00.000Z')
    expect(result).toContain('Dec')
    expect(result).toContain('25')
    expect(result).toContain('2025')
  })
})

describe('formatRelativeDate', () => {
  // This function depends on Date.now(), so we need to mock it for stable tests
  // We import dynamically after mocking to ensure the module picks up the mock
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T12:00:00.000Z'))
  })

  it('should return relative seconds', async () => {
    const { formatRelativeDate } = await import('../date')
    const result = formatRelativeDate('2026-04-22T11:59:30.000Z')
    // 30 seconds ago
    expect(result).toContain('second')
  })

  it('should return relative minutes', async () => {
    const { formatRelativeDate } = await import('../date')
    const result = formatRelativeDate('2026-04-22T11:55:00.000Z')
    // 5 minutes ago
    expect(result).toContain('minute')
  })

  it('should return relative hours', async () => {
    const { formatRelativeDate } = await import('../date')
    const result = formatRelativeDate('2026-04-22T09:00:00.000Z')
    // 3 hours ago
    expect(result).toContain('hour')
  })

  it('should return relative days', async () => {
    const { formatRelativeDate } = await import('../date')
    const result = formatRelativeDate('2026-04-20T12:00:00.000Z')
    // 2 days ago
    expect(result).toContain('day')
  })
})
