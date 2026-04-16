<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { useContactsStore } from '@/stores/contacts.store'
import CampaignFormModal from '@/components/campaigns/CampaignFormModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import InteractionTimeline from '@/components/interactions/InteractionTimeline.vue'
import InteractionForm from '@/components/interactions/InteractionForm.vue'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const campaignsStore = useCampaignsStore()
const contactsStore = useContactsStore()

const campaignId = Number(route.params.id)
const showEdit = ref(false)
const showArchive = ref(false)
const showAddContacts = ref(false)
const showInteractionForm = ref(false)
const interactionKey = ref(0)
const selectedContactIds = ref<number[]>([])
const addingContacts = ref(false)

async function handleArchive() {
  await campaignsStore.archive(campaignId)
  router.push({ name: 'campaigns' })
}

function openAddContacts() {
  selectedContactIds.value = []
  contactsStore.fetchList(200, 0)
  showAddContacts.value = true
}

async function handleAddContacts() {
  if (!selectedContactIds.value.length) return
  addingContacts.value = true
  try {
    await campaignsStore.addContacts(campaignId, selectedContactIds.value)
    showAddContacts.value = false
  } finally {
    addingContacts.value = false
  }
}

async function handleRemoveContact(contactId: number) {
  await campaignsStore.removeContact(campaignId, contactId)
}

function onEditSaved() {
  showEdit.value = false
  campaignsStore.fetchOne(campaignId)
}

function onInteractionSaved() {
  showInteractionForm.value = false
  interactionKey.value++
}

function toggleContact(id: number) {
  const idx = selectedContactIds.value.indexOf(id)
  if (idx >= 0) selectedContactIds.value.splice(idx, 1)
  else selectedContactIds.value.push(id)
}

onMounted(async () => {
  await campaignsStore.fetchOne(campaignId)
  await campaignsStore.fetchParticipants(campaignId)
})
onUnmounted(() => campaignsStore.clearCurrent())
</script>

<template>
  <div>
    <button
      class="mb-4 text-sm text-gray-500 transition-colors hover:text-gray-700"
      @click="router.push({ name: 'campaigns' })"
    >
      ← Back to Campaigns
    </button>

    <div v-if="campaignsStore.loading" class="text-center text-gray-500">Loading…</div>
    <div v-else-if="campaignsStore.error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ campaignsStore.error }}</div>

    <template v-else-if="campaignsStore.current">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">{{ campaignsStore.current.name }}</h1>
          <StatusBadge :label="campaignsStore.current.status" :variant="campaignsStore.current.status" />
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

      <!-- Info -->
      <div class="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">Description</p>
          <p class="mt-1 text-sm text-gray-900">{{ campaignsStore.current.description }}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">Objective</p>
          <p class="mt-1 text-sm text-gray-900">{{ campaignsStore.current.objective }}</p>
        </div>
        <div class="flex gap-8">
          <div>
            <p class="text-xs font-medium uppercase text-gray-500">Created</p>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(campaignsStore.current.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-gray-500">Updated</p>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(campaignsStore.current.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <div class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Participants
            <span class="text-sm font-normal text-gray-500">({{ campaignsStore.participants.length }})</span>
          </h2>
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            @click="openAddContacts"
          >
            + Add Contacts
          </button>
        </div>

        <div v-if="campaignsStore.participants.length === 0" class="mt-4 text-sm text-gray-500">
          No contacts added to this campaign yet.
        </div>

        <div v-else class="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Outlet</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Outreach</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="p in campaignsStore.participants" :key="p.campaignContactId">
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  <router-link :to="{ name: 'contact-detail', params: { id: p.contactId } }" class="hover:text-blue-600">
                    {{ p.contactName }}
                  </router-link>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{{ p.outlet }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ p.status }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ p.lastOutreachAt ? formatDate(p.lastOutreachAt) : '—' }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    class="text-sm text-red-600 transition-colors hover:text-red-800"
                    @click="handleRemoveContact(p.contactId)"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
          <InteractionTimeline :key="interactionKey" :campaign-id="campaignId" />
        </div>
      </div>
    </template>

    <!-- Modals -->
    <CampaignFormModal
      :open="showEdit"
      :campaign="campaignsStore.current"
      @close="showEdit = false"
      @saved="onEditSaved"
    />

    <ConfirmDialog
      :open="showArchive"
      title="Archive Campaign"
      message="This campaign will be archived and hidden from the list. This action can be undone."
      confirm-label="Archive"
      variant="danger"
      @cancel="showArchive = false"
      @confirm="handleArchive"
    />

    <!-- Add Contacts Modal -->
    <dialog
      ref="addContactsDialogRef"
      :open="showAddContacts || undefined"
      class="rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/40"
      @cancel.prevent="showAddContacts = false"
    >
      <div v-if="showAddContacts" class="w-[28rem] p-6">
        <h3 class="text-lg font-semibold text-gray-900">Add Contacts to Campaign</h3>
        <div v-if="contactsStore.items.length === 0" class="mt-4 text-sm text-gray-500">
          No contacts available. Create contacts first.
        </div>
        <div v-else class="mt-4 max-h-64 space-y-2 overflow-y-auto">
          <label
            v-for="c in contactsStore.items"
            :key="c.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :checked="selectedContactIds.includes(c.id)"
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
              @change="toggleContact(c.id)"
            />
            <div>
              <p class="text-sm font-medium text-gray-900">{{ c.name }}</p>
              <p class="text-xs text-gray-500">{{ c.outlet }}</p>
            </div>
          </label>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            @click="showAddContacts = false"
          >
            Cancel
          </button>
          <button
            :disabled="!selectedContactIds.length || addingContacts"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            @click="handleAddContacts"
          >
            {{ addingContacts ? 'Adding…' : `Add (${selectedContactIds.length})` }}
          </button>
        </div>
      </div>
    </dialog>

    <InteractionForm
      :open="showInteractionForm"
      :campaign-id="campaignId"
      @close="showInteractionForm = false"
      @saved="onInteractionSaved"
    />
  </div>
</template>
