<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/stores/contacts.store'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ContactFormModal from '@/components/contacts/ContactFormModal.vue'
import { formatRelativeDate } from '@/utils/date'
import TableSkeleton from '@/components/ui/skeletons/TableSkeleton.vue'

const router = useRouter()
const store = useContactsStore()

const limit = 20
const offset = ref(0)
const search = ref('')
const showCreate = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    offset.value = 0
    store.fetchList(limit, 0, val)
  }, 300)
})

function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-700 bg-green-50'
  if (score >= 40) return 'text-yellow-700 bg-yellow-50'
  return 'text-gray-600 bg-gray-100'
}

function goToDetail(id: number) {
  router.push({ name: 'contact-detail', params: { id } })
}

function onPageChange(newOffset: number) {
  offset.value = newOffset
  store.fetchList(limit, newOffset)
}

onMounted(() => store.fetchList(limit, 0))
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Contacts</h1>
      <button
        class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        @click="showCreate = true"
      >
        + Add Contact
      </button>
    </div>

    <!-- Search -->
    <div class="mt-4">
      <input
        v-model="search"
        placeholder="Filter by name or outlet…"
        class="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] shadow-sm focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
      />
    </div>

    <!-- Loading -->
    <TableSkeleton v-if="store.loading" :columns="5" :rows="6" />

    <!-- Error -->
    <div v-else-if="store.error" class="mt-4 rounded-lg bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
      {{ store.error }}
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="store.items.length === 0"
      title="No contacts yet"
      description="Add your first media contact to get started."
      action-label="Add Contact"
      class="mt-8"
      @action="showCreate = true"
    />

    <!-- Table -->
    <div v-else class="mt-4 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table class="min-w-full divide-y divide-[var(--color-border)]">
        <thead class="bg-[var(--color-bg-secondary)]">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Outlet</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Score</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Last Contacted</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Campaigns</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--color-border)]">
          <tr
            v-for="contact in store.items"
            :key="contact.id"
            class="cursor-pointer transition-colors hover:bg-[var(--color-bg-secondary)]"
            @click="goToDetail(contact.id)"
          >
            <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{{ contact.name }}</td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">{{ contact.outlet }}</td>
            <td class="whitespace-nowrap px-6 py-4">
              <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', scoreColor(contact.score)]">
                {{ contact.score }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">
              {{ contact.lastContactedAt ? formatRelativeDate(contact.lastContactedAt) : '—' }}
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">{{ contact.campaignCount }}</td>
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

    <ContactFormModal :open="showCreate" @close="showCreate = false" @saved="showCreate = false" />
  </div>
</template>
