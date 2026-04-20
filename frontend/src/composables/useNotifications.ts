import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: number
  type: NotificationType
  message: string
}

const items = ref<Notification[]>([])
let nextId = 1

const DURATION: Record<NotificationType, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
}

const MAX_VISIBLE = 5

function remove(id: number) {
  items.value = items.value.filter((n) => n.id !== id)
}

function notify(opts: { type: NotificationType; message: string }) {
  const id = nextId++
  const notification: Notification = { id, ...opts }

  if (items.value.length >= MAX_VISIBLE) {
    items.value.splice(0, 1)
  }

  items.value.push(notification)

  setTimeout(() => remove(id), DURATION[opts.type])
}

export function useNotifications() {
  return { items, notify, remove }
}
