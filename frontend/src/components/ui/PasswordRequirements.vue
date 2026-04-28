<script setup lang="ts">
import { computed } from 'vue'
import { passwordRules } from '@/utils/passwordRules'

const props = defineProps<{
  password: string
  showOnlyOnFocus?: boolean
  focused?: boolean
  showErrors?: boolean
}>()

const results = computed(() =>
  passwordRules.map((rule) => ({
    ...rule,
    passed: props.password.length > 0 && rule.test(props.password),
  })),
)

const visible = computed(() => {
  if (!props.showOnlyOnFocus) return true
  return props.focused || props.password.length > 0
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-150 ease-in"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <ul v-if="visible" class="mt-2 space-y-1" role="list" aria-label="Password requirements">
      <li
        v-for="rule in results"
        :key="rule.id"
        class="flex items-center gap-1.5 text-xs transition-colors duration-150"
        :class="rule.passed ? 'text-emerald-600' : props.showErrors ? 'text-red-500' : 'text-gray-400'"
      >
        <svg
          v-if="rule.passed"
          class="h-3.5 w-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else
          class="h-3.5 w-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z"
            clip-rule="evenodd"
          />
        </svg>
        <span>{{ rule.label }}</span>
      </li>
    </ul>
  </Transition>
</template>
