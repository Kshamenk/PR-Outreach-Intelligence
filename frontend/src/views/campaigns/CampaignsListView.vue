<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns.store'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CampaignFormModal from '@/components/campaigns/CampaignFormModal.vue'
import { formatDate } from '@/utils/date'

const router = useRouter()
const store = useCampaignsStore()

const limit = 20
const offset = ref(0)
const search = ref('')
const showCreate = ref(false)

const filtered = computed(() => {
  if (!search.value) return store.items
  const q = search.value.toLowerCase()
  return store.items.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  )
})

function goToDetail(id: number) {
  router.push({ name: 'campaign-detail', params: { id } })
}

function onPageChange(newOffset: number) {
  offset.value = newOffset
  store.fetchList(limit, newOffset)
}

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

onMounted(() => store.fetchList(limit, 0))
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Campaigns</h1>
      <button
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="showCreate = true"
      >
        + New Campaign
      </button>
    </div>

    <!-- Search -->
    <div class="mt-4">
      <input
        v-model="search"
        placeholder="Filter by name or description…"
        class="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="mt-8 text-center text-gray-500">Loading…</div>

    <!-- Error -->
    <div v-else-if="store.error" class="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
      {{ store.error }}
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="store.items.length === 0"
      title="No campaigns yet"
      description="Create your first campaign to start organizing outreach efforts."
      action-label="New Campaign"
      class="mt-8"
      @action="showCreate = true"
    />

    <!-- Table -->
    <div v-else class="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="campaign in filtered"
            :key="campaign.id"
            class="cursor-pointer transition-colors hover:bg-gray-50"
            @click="goToDetail(campaign.id)"
          >
            <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{{ campaign.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ truncate(campaign.description) }}</td>
            <td class="whitespace-nowrap px-6 py-4">
              <StatusBadge :label="campaign.status" :variant="campaign.status" />
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatDate(campaign.createdAt) }}</td>
          </tr>
        </tbody>
      </table>

      <PaginationControls
        v-if="store.total > limit"
        :total="store.total"
        :limit="limit"
        :offset="offset"
        class="px-6 pb-4"
        @update:offset="onPageChange"
      />
    </div>

    <CampaignFormModal :open="showCreate" @close="showCreate = false" @saved="showCreate = false" />
  </div>
</template>
