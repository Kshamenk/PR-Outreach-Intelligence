const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const WEEK = 604800
const MONTH = 2592000
const YEAR = 31536000

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelativeDate(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.round((then - now) / 1000)
  const absDiff = Math.abs(diff)

  if (absDiff < MINUTE) return rtf.format(diff, 'second')
  if (absDiff < HOUR) return rtf.format(Math.round(diff / MINUTE), 'minute')
  if (absDiff < DAY) return rtf.format(Math.round(diff / HOUR), 'hour')
  if (absDiff < WEEK) return rtf.format(Math.round(diff / DAY), 'day')
  if (absDiff < MONTH) return rtf.format(Math.round(diff / WEEK), 'week')
  if (absDiff < YEAR) return rtf.format(Math.round(diff / MONTH), 'month')
  return rtf.format(Math.round(diff / YEAR), 'year')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
