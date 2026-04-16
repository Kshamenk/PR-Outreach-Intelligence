<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/stores/contacts.store'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ContactFormModal from '@/components/contacts/ContactFormModal.vue'
import { formatRelativeDate } from '@/utils/date'

const router = useRouter()
const store = useContactsStore()

const limit = 20
const offset = ref(0)
const search = ref('')
const showCreate = ref(false)

const filtered = computed(() => {
  if (!search.value) return store.items
  const q = search.value.toLowerCase()
  return store.items.filter(
    (c) => c.name.toLowerCase().includes(q) || c.outlet.toLowerCase().includes(q),
  )
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
      <h1 class="text-2xl font-bold text-gray-900">Contacts</h1>
      <button
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
      title="No contacts yet"
      description="Add your first media contact to get started."
      action-label="Add Contact"
      class="mt-8"
      @action="showCreate = true"
    />

    <!-- Table -->
    <div v-else class="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Outlet</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Contacted</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Campaigns</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="contact in filtered"
            :key="contact.id"
            class="cursor-pointer transition-colors hover:bg-gray-50"
            @click="goToDetail(contact.id)"
          >
            <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{{ contact.name }}</td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{{ contact.outlet }}</td>
            <td class="whitespace-nowrap px-6 py-4">
              <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', scoreColor(contact.score)]">
                {{ contact.score }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {{ contact.lastContactedAt ? formatRelativeDate(contact.lastContactedAt) : '—' }}
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ contact.campaignCount }}</td>
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
