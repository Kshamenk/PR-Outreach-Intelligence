<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { useContactsStore } from '@/stores/contacts.store'
import CampaignFormModal from '@/components/campaigns/CampaignFormModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import InteractionTimeline from '@/components/interactions/InteractionTimeline.vue'
import InteractionForm from '@/components/interactions/InteractionForm.vue'
import { formatDate } from '@/utils/date'
import CampaignDetailSkeleton from '@/components/ui/skeletons/CampaignDetailSkeleton.vue'

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
const addContactsDialogRef = ref<HTMLDialogElement | null>(null)

watch(showAddContacts, (isOpen) => {
  if (isOpen) addContactsDialogRef.value?.showModal()
  else addContactsDialogRef.value?.close()
})

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
      class="mb-4 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
      @click="router.push({ name: 'campaigns' })"
    >
      ← Back to Campaigns
    </button>

    <CampaignDetailSkeleton v-if="campaignsStore.loading" />
    <div v-else-if="campaignsStore.error" class="rounded-lg bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">{{ campaignsStore.error }}</div>

    <template v-else-if="campaignsStore.current">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">{{ campaignsStore.current.name }}</h1>
          <StatusBadge :label="campaignsStore.current.status" :variant="campaignsStore.current.status" />
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
            @click="showEdit = true"
          >
            Edit
          </button>
          <button
            class="rounded-lg border border-[var(--color-danger)] px-4 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-bg-secondary)]"
            @click="showArchive = true"
          >
            Archive
          </button>
        </div>
      </div>

      <!-- Info -->
      <div class="mt-6 space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div>
          <p class="text-xs font-medium uppercase text-[var(--color-text-secondary)]">Description</p>
          <p class="mt-1 text-sm text-[var(--color-text-primary)]">{{ campaignsStore.current.description }}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-[var(--color-text-secondary)]">Objective</p>
          <p class="mt-1 text-sm text-[var(--color-text-primary)]">{{ campaignsStore.current.objective }}</p>
        </div>
        <div class="flex gap-8">
          <div>
            <p class="text-xs font-medium uppercase text-[var(--color-text-secondary)]">Created</p>
            <p class="mt-1 text-sm text-[var(--color-text-primary)]">{{ formatDate(campaignsStore.current.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-[var(--color-text-secondary)]">Updated</p>
            <p class="mt-1 text-sm text-[var(--color-text-primary)]">{{ formatDate(campaignsStore.current.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <div class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
            Participants
            <span class="text-sm font-normal text-[var(--color-text-secondary)]">({{ campaignsStore.participants.length }})</span>
          </h2>
          <button
            class="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
            @click="openAddContacts"
          >
            + Add Contacts
          </button>
        </div>

        <div v-if="campaignsStore.participants.length === 0" class="mt-4 text-sm text-[var(--color-text-secondary)]">
          No contacts added to this campaign yet.
        </div>

        <div v-else class="mt-4 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table class="min-w-full divide-y divide-[var(--color-border)]">
            <thead class="bg-[var(--color-bg-secondary)]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Outlet</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Last Outreach</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr v-for="p in campaignsStore.participants" :key="p.campaignContactId">
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">
                  <router-link :to="{ name: 'contact-detail', params: { id: p.contactId } }" class="hover:text-[var(--color-accent)]">
                    {{ p.contactName }}
                  </router-link>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">{{ p.outlet }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">{{ p.status }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                  {{ p.lastOutreachAt ? formatDate(p.lastOutreachAt) : '—' }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right space-x-3">
                  <router-link
                    :to="{ name: 'outreach', query: { contactId: p.contactId, campaignId: campaignId } }"
                    class="text-sm text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
                  >
                    Draft Outreach
                  </router-link>
                  <button
                    class="text-sm text-[var(--color-danger)] transition-colors hover:text-[var(--color-danger-hover)]"
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
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Interactions</h2>
          <button
            class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
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
      class="mx-4 w-full max-w-[28rem] rounded-xl bg-[var(--color-surface)] p-0 shadow-xl backdrop:bg-black/40"
      @cancel.prevent="showAddContacts = false"
    >
      <div v-if="showAddContacts" class="max-h-[85vh] overflow-y-auto p-6">
        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Add Contacts to Campaign</h3>
        <div v-if="contactsStore.items.length === 0" class="mt-4 text-sm text-[var(--color-text-secondary)]">
          No contacts available. Create contacts first.
        </div>
        <div v-else class="mt-4 max-h-64 space-y-2 overflow-y-auto">
          <label
            v-for="c in contactsStore.items"
            :key="c.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            <input
              type="checkbox"
              :checked="selectedContactIds.includes(c.id)"
              class="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
              @change="toggleContact(c.id)"
            />
            <div>
              <p class="text-sm font-medium text-[var(--color-text-primary)]">{{ c.name }}</p>
              <p class="text-xs text-[var(--color-text-secondary)]">{{ c.outlet }}</p>
            </div>
          </label>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
            @click="showAddContacts = false"
          >
            Cancel
          </button>
          <button
            :disabled="!selectedContactIds.length || addingContacts"
            class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
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
