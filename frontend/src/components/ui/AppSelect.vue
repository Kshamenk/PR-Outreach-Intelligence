<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

export interface SelectOption {
  value: string | number | null | undefined
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    required?: boolean
    variant?: 'default' | 'modal'
  }>(),
  {
    placeholder: 'Select…',
    disabled: false,
    required: false,
    variant: 'default',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null | undefined]
}>()

const open = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)
const listRef = ref<HTMLUListElement | null>(null)

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue)
  return found ? found.label : ''
})

const hasSelection = computed(() => {
  return props.options.some((o) => o.value === props.modelValue && !o.disabled)
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      // Scroll active option into view
      const active = listRef.value?.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'nearest' })
    })
  }
}

function select(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})

const baseClasses = computed(() =>
  props.variant === 'modal'
    ? 'block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none'
    : 'mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none',
)
</script>

<template>
  <!-- Desktop: native select (hidden on mobile) -->
  <select
    :value="modelValue"
    :disabled="disabled"
    :required="required"
    :class="[baseClasses, 'hidden md:block text-[var(--color-text-primary)]']"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value === '' ? null : isNaN(Number(($event.target as HTMLSelectElement).value)) ? ($event.target as HTMLSelectElement).value : Number(($event.target as HTMLSelectElement).value))"
  >
    <option
      v-for="opt in options"
      :key="String(opt.value)"
      :value="opt.value ?? ''"
      :disabled="opt.disabled"
    >
      {{ opt.label }}
    </option>
  </select>

  <!-- Mobile: custom dropdown (hidden on desktop) -->
  <div ref="containerRef" class="relative md:hidden">
    <button
      type="button"
      :disabled="disabled"
      :class="[baseClasses, 'flex items-center justify-between text-left', hasSelection ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]']"
      @click="toggle"
    >
      <span class="truncate">{{ hasSelection ? selectedLabel : placeholder }}</span>
      <svg
        class="ml-2 h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform"
        :class="{ 'rotate-180': open }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <ul
        v-if="open"
        ref="listRef"
        class="absolute z-50 mt-1 max-h-[40vh] w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
      >
        <li
          v-for="opt in options"
          :key="String(opt.value)"
          :data-active="opt.value === modelValue"
          :class="[
            'cursor-pointer truncate px-4 py-2.5 text-sm transition-colors',
            opt.value === modelValue
              ? 'bg-[var(--color-accent)]/10 font-medium text-[var(--color-accent)]'
              : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
            opt.disabled ? 'cursor-not-allowed opacity-50' : '',
          ]"
          @click="select(opt)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
