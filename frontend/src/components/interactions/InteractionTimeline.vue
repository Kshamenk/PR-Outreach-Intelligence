<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useInteractionsStore } from '@/stores/interactions.store'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { formatRelativeDate } from '@/utils/date'

const props = defineProps<{
  contactId?: number
  campaignId?: number
}>()

const store = useInteractionsStore()
const limit = 20
const offset = ref(0)

const directionIcons: Record<string, string> = {
  outbound: '↗',
  inbound: '↙',
  internal: '📝',
}

function load() {
  store.fetchList({
    contactId: props.contactId,
    campaignId: props.campaignId,
    limit,
    offset: offset.value,
  })
}

function onPageChange(newOffset: number) {
  offset.value = newOffset
  load()
}

function truncate(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

watch(() => [props.contactId, props.campaignId], () => {
  offset.value = 0
  load()
})

onMounted(load)
</script>

<template>
  <div>
    <div v-if="store.loading" class="py-8 text-center text-sm text-gray-500">Loading interactions…</div>

    <div v-else-if="store.items.length === 0" class="py-8 text-center text-sm text-gray-500">
      No interactions recorded yet.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in store.items"
        :key="item.id"
        class="rounded-lg border border-gray-200 bg-white p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg" :title="item.direction">{{ directionIcons[item.direction] ?? '•' }}</span>
            <StatusBadge :label="item.channel" :variant="item.channel" />
            <StatusBadge :label="item.status" :variant="item.direction" />
          </div>
          <span class="text-xs text-gray-400">{{ formatRelativeDate(item.occurredAt) }}</span>
        </div>

        <p v-if="item.subject" class="mt-2 text-sm font-medium text-gray-900">{{ item.subject }}</p>
        <p class="mt-1 text-sm text-gray-600">{{ truncate(item.content) }}</p>
      </div>

      <PaginationControls
        v-if="store.total > limit"
        :total="store.total"
        :limit="limit"
        :offset="offset"
        @update:offset="onPageChange"
      />
    </div>
  </div>
</template>
