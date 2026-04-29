import { ref, watch } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'pr-outreach-theme'

const current = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || 'system')

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

let initialized = false

function initTheme() {
  applyTheme(current.value)
  if (!initialized) {
    initialized = true
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (current.value === 'system') applyTheme('system')
    })
  }
}

watch(current, (theme) => {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
})

export function useTheme() {
  return { theme: current, initTheme }
}
