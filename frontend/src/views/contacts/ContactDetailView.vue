<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactsStore } from '@/stores/contacts.store'
import ContactFormModal from '@/components/contacts/ContactFormModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import InteractionTimeline from '@/components/interactions/InteractionTimeline.vue'
import InteractionForm from '@/components/interactions/InteractionForm.vue'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const store = useContactsStore()

const contactId = Number(route.params.id)
const showEdit = ref(false)
const showArchive = ref(false)
const showInteractionForm = ref(false)
const interactionKey = ref(0)

function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-700 bg-green-50 ring-green-300'
  if (score >= 40) return 'text-yellow-700 bg-yellow-50 ring-yellow-300'
  return 'text-gray-600 bg-gray-100 ring-gray-300'
}

async function handleArchive() {
  await store.archive(contactId)
  router.push({ name: 'contacts' })
}

function onInteractionSaved() {
  showInteractionForm.value = false
  interactionKey.value++
  store.fetchOne(contactId)
}

onMounted(() => store.fetchOne(contactId))
onUnmounted(() => store.clearCurrent())
</script>

<template>
  <div>
    <!-- Back link -->
    <button
      class="mb-4 text-sm text-gray-500 transition-colors hover:text-gray-700"
      @click="router.push({ name: 'contacts' })"
    >
      ← Back to Contacts
    </button>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center text-gray-500">Loading…</div>

    <!-- Error -->
    <div v-else-if="store.error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ store.error }}</div>

    <!-- Content -->
    <template v-else-if="store.current">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ store.current.name }}</h1>
          <p class="mt-1 text-gray-600">{{ store.current.outlet }}</p>
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            @click="showEdit = true"
          >
            Edit
          </button>
          <button
            class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            @click="showArchive = true"
          >
            Archive
          </button>
        </div>
      </div>

      <!-- Info grid -->
      <div class="mt-6 grid grid-cols-2 gap-6 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-4">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">Email</p>
          <p class="mt-1 text-sm text-gray-900">{{ store.current.email }}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">Score</p>
          <span :class="['mt-1 inline-block rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ring-inset', scoreColor(store.current.score)]">
            {{ store.current.score }}
          </span>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">Last Contacted</p>
          <p class="mt-1 text-sm text-gray-900">
            {{ store.current.lastContactedAt ? formatDate(store.current.lastContactedAt) : '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">Created</p>
          <p class="mt-1 text-sm text-gray-900">{{ formatDate(store.current.createdAt) }}</p>
        </div>
      </div>

      <!-- Topics -->
      <div v-if="store.current.topics.length" class="mt-4">
        <p class="text-xs font-medium uppercase text-gray-500">Topics</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="topic in store.current.topics"
            :key="topic"
            class="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-300"
          >
            {{ topic }}
          </span>
        </div>
      </div>

      <!-- Interactions -->
      <div class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Interactions</h2>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            @click="showInteractionForm = true"
          >
            + Log Interaction
          </button>
        </div>
        <div class="mt-4">
          <InteractionTimeline :key="interactionKey" :contact-id="contactId" />
        </div>
      </div>
    </template>

    <!-- Modals -->
    <ContactFormModal
      :open="showEdit"
      :contact="store.current"
      @close="showEdit = false"
      @saved="showEdit = false"
    />

    <ConfirmDialog
      :open="showArchive"
      title="Archive Contact"
      message="This contact will be archived and hidden from the list. This action can be undone."
      confirm-label="Archive"
      variant="danger"
      @cancel="showArchive = false"
      @confirm="handleArchive"
    />

    <InteractionForm
      :open="showInteractionForm"
      :contact-id="contactId"
      @close="showInteractionForm = false"
      @saved="onInteractionSaved"
    />
  </div>
</template>
