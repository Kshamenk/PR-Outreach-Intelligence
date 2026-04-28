<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns.store'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CampaignFormModal from '@/components/campaigns/CampaignFormModal.vue'
import { formatDate } from '@/utils/date'
import TableSkeleton from '@/components/ui/skeletons/TableSkeleton.vue'

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
      <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Campaigns</h1>
      <button
        class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
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
        class="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] shadow-sm focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
      />
    </div>

    <!-- Loading -->
    <TableSkeleton v-if="store.loading" :columns="4" :rows="6" />

    <!-- Error -->
    <div v-else-if="store.error" class="mt-4 rounded-lg bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
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
    <div v-else class="mt-4 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table class="min-w-full divide-y divide-[var(--color-border)]">
        <thead class="bg-[var(--color-bg-secondary)]">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Description</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--color-border)]">
          <tr
            v-for="campaign in filtered"
            :key="campaign.id"
            class="cursor-pointer transition-colors hover:bg-[var(--color-bg-secondary)]"
            @click="goToDetail(campaign.id)"
          >
            <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{{ campaign.name }}</td>
            <td class="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{{ truncate(campaign.description) }}</td>
            <td class="whitespace-nowrap px-6 py-4">
              <StatusBadge :label="campaign.status" :variant="campaign.status" />
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">{{ formatDate(campaign.createdAt) }}</td>
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
