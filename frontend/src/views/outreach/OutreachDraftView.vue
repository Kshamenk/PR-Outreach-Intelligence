<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useContactsStore } from '@/stores/contacts.store'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { useNotifications } from '@/composables/useNotifications'
import * as aiApi from '@/api/ai.api'
import * as messagingApi from '@/api/messaging.api'
import type { GenerateOutreachResponseDTO, AISuggestionDTO } from '@pr-outreach/shared-types'
import S from '@/components/ui/SkeletonBlock.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { SelectOption } from '@/components/ui/AppSelect.vue'

const route = useRoute()
const contactsStore = useContactsStore()
const campaignsStore = useCampaignsStore()
const { notify } = useNotifications()

// ── Form state ──
const selectedContactId = ref<number | null>(null)
const selectedCampaignId = ref<number | null>(null)
const tone = ref<'warm' | 'neutral' | 'direct'>('neutral')
const length = ref<'short' | 'medium' | 'long'>('medium')

// ── Result state ──
const generating = ref(false)
const sending = ref(false)
const draftAccepted = ref(false)
const error = ref('')
const result = ref<GenerateOutreachResponseDTO | null>(null)
const resultCardRef = ref<HTMLElement | null>(null)
const suggestionId = ref<number | null>(null)
const editSubject = ref('')
const editBody = ref('')

// Track the context used for the current draft to prevent sending to the wrong contact
const draftContactId = ref<number | null>(null)
const draftCampaignId = ref<number | null>(null)
const draftStatus = ref<string>('') // tracks the real suggestion status
let generateGeneration = 0 // guards against stale generate() responses

// Clear the draft when contact or campaign selection changes
watch([selectedContactId, selectedCampaignId], () => {
  if (result.value && (selectedContactId.value !== draftContactId.value || selectedCampaignId.value !== draftCampaignId.value)) {
    result.value = null
    suggestionId.value = null
    editSubject.value = ''
    editBody.value = ''
    draftAccepted.value = false
    draftStatus.value = ''
    draftContactId.value = null
    draftCampaignId.value = null
  }
})

// ── History ──
const history = ref<AISuggestionDTO[]>([])
const historyLoading = ref(false)

// ── Select options (for AppSelect) ──
const contactOptions = computed<SelectOption[]>(() => [
  { value: null, label: 'Select a contact…', disabled: true },
  ...contactsStore.items.map((c) => ({ value: c.id, label: `${c.name} — ${c.outlet}` })),
])
const campaignOptions = computed<SelectOption[]>(() => [
  { value: null, label: 'Select a campaign…', disabled: true },
  ...campaignsStore.items.map((c) => ({ value: c.id, label: c.name })),
])

onMounted(async () => {
  // Pre-fill from query params
  const qContact = Number(route.query.contactId)
  const qCampaign = Number(route.query.campaignId)
  if (qContact) selectedContactId.value = qContact
  if (qCampaign) selectedCampaignId.value = qCampaign

  await Promise.all([
    contactsStore.fetchList(200, 0),
    campaignsStore.fetchList(200, 0),
    loadHistory(),
  ])
})

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await aiApi.listSuggestions(10, 0)
    history.value = res.data
  } catch {
    /* silent */
  } finally {
    historyLoading.value = false
  }
}

async function generate() {
  if (!selectedContactId.value || !selectedCampaignId.value) {
    error.value = 'Please select both a contact and a campaign'
    return
  }

  generating.value = true
  error.value = ''
  result.value = null
  draftAccepted.value = false
  const currentGen = ++generateGeneration
  try {
    const res = await aiApi.generateOutreach({
      contactId: selectedContactId.value,
      campaignId: selectedCampaignId.value,
      tone: tone.value,
      length: length.value,
    })
    if (currentGen !== generateGeneration) return // stale response — discard
    result.value = res
    suggestionId.value = res.suggestionId
    editSubject.value = res.subject
    editBody.value = res.body
    draftContactId.value = selectedContactId.value
    draftCampaignId.value = selectedCampaignId.value
    draftStatus.value = 'draft'
    notify({ type: 'success', message: 'Draft generated successfully' })
    await loadHistory()
  } catch (err: any) {
    error.value = err.message ?? 'Failed to generate draft'
    notify({ type: 'error', message: error.value })
  } finally {
    generating.value = false
  }
}

async function acceptDraft() {
  if (!suggestionId.value) return
  try {
    await aiApi.acceptSuggestion(suggestionId.value)
    draftAccepted.value = true
    draftStatus.value = 'accepted'
    notify({ type: 'success', message: 'Draft accepted — ready to send' })
    await loadHistory()
  } catch (err: any) {
    notify({ type: 'error', message: err.message ?? 'Failed to accept draft' })
  }
}

async function rejectDraft() {
  if (!suggestionId.value) return
  try {
    await aiApi.rejectSuggestion(suggestionId.value)
    draftAccepted.value = false
    draftStatus.value = 'rejected'
    notify({ type: 'info', message: 'Draft rejected' })
    await loadHistory()
  } catch (err: any) {
    notify({ type: 'error', message: err.message ?? 'Failed to reject draft' })
  }
}

async function sendEmail() {
  if (!suggestionId.value || !draftContactId.value) return
  sending.value = true
  try {
    await messagingApi.sendEmail({
      contactId: draftContactId.value,
      campaignId: draftCampaignId.value ?? undefined,
      subject: editSubject.value,
      body: editBody.value,
      aiSuggestionId: suggestionId.value,
    })
    draftAccepted.value = false
    draftStatus.value = 'sent'
    notify({ type: 'success', message: 'Email sent successfully!' })
    await loadHistory()
  } catch (err: any) {
    notify({ type: 'error', message: err.message ?? 'Failed to send email' })
  } finally {
    sending.value = false
  }
}

function loadSuggestion(s: AISuggestionDTO) {
  suggestionId.value = s.id
  editSubject.value = s.subject
  editBody.value = s.body
  draftStatus.value = s.status
  draftAccepted.value = s.status === 'accepted'
  draftContactId.value = s.contactId
  draftCampaignId.value = s.campaignId
  selectedContactId.value = s.contactId
  selectedCampaignId.value = s.campaignId
  result.value = {
    suggestionId: s.id,
    subject: s.subject,
    body: s.body,
    model: s.model ?? '',
    promptVersion: s.promptVersion ?? '',
  }
  // On mobile, scroll to the result card
  if (window.innerWidth < 768) {
    nextTick(() => {
      resultCardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

const isActionable = () => draftStatus.value === 'draft' || draftStatus.value === 'accepted'

const toneOptions: { value: typeof tone.value; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'direct', label: 'Direct' },
]

const lengthOptions: { value: typeof length.value; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">AI Outreach Draft</h1>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">Generate AI-assisted email drafts for your PR contacts.</p>
    </div>

    <div class="grid min-w-0 gap-6 lg:grid-cols-3">
      <!-- Left: Form -->
      <div class="min-w-0 space-y-6 lg:col-span-2">
        <!-- Configuration card -->
        <div class="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Configure Draft</h2>

          <!-- Contact -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)]">Contact</label>
            <AppSelect
              :model-value="selectedContactId"
              :options="contactOptions"
              placeholder="Select a contact…"
              @update:model-value="selectedContactId = $event as number | null"
            />
          </div>

          <!-- Campaign -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)]">Campaign</label>
            <AppSelect
              :model-value="selectedCampaignId"
              :options="campaignOptions"
              placeholder="Select a campaign…"
              @update:model-value="selectedCampaignId = $event as number | null"
            />
          </div>

          <!-- Tone -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Tone</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="opt in toneOptions"
                :key="opt.value"
                :class="[
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  tone === opt.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
                ]"
              >
                <input v-model="tone" type="radio" :value="opt.value" class="sr-only" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Length -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Length</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="opt in lengthOptions"
                :key="opt.value"
                :class="[
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  length === opt.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
                ]"
              >
                <input v-model="length" type="radio" :value="opt.value" class="sr-only" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="rounded-lg bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
            {{ error }}
          </div>

          <!-- Generate button -->
          <button
            :disabled="generating || !selectedContactId || !selectedCampaignId"
            class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            @click="generate"
          >
            {{ generating ? 'Generating…' : 'Generate Draft' }}
          </button>
        </div>

        <!-- Result card -->
        <div v-if="result" ref="resultCardRef" class="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <div class="flex items-start justify-between">
            <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Generated Draft</h2>
            <span class="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
              {{ result.model }} · {{ result.promptVersion }}
            </span>
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)]">Subject</label>
            <input
              v-model="editSubject"
              type="text"
              class="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-sm focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <!-- Body -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)]">Body</label>
            <textarea
              v-model="editBody"
              rows="10"
              class="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-sm focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <!-- Actions -->
          <div v-if="!isActionable()" class="rounded-lg bg-[var(--color-bg-secondary)] p-3 text-sm text-[var(--color-text-secondary)]">
            This draft is <strong>{{ draftStatus }}</strong> and cannot be modified. Generate a new draft to continue.
          </div>
          <div v-else class="flex flex-wrap gap-3">
            <button
              v-if="draftAccepted"
              :disabled="sending"
              class="rounded-lg bg-[var(--color-success)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              @click="sendEmail"
            >
              {{ sending ? 'Sending…' : '📧 Send Email' }}
            </button>
            <button
              v-if="!draftAccepted"
              class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              @click="acceptDraft"
            >
              Accept Draft
            </button>
            <button
              v-if="draftStatus === 'draft' || draftStatus === 'accepted'"
              class="rounded-lg border border-[var(--color-danger)] px-4 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="rejectDraft"
            >
              Reject
            </button>
            <button
              class="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="generate"
              :disabled="generating"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <!-- Right: History -->
      <div class="min-w-0 space-y-4">
        <div class="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recent Suggestions</h2>

          <div v-if="historyLoading" class="skeleton-delay space-y-3">
            <div v-for="i in 4" :key="i" class="rounded-lg border border-[var(--color-border)] p-3">
              <S class="h-4 w-full max-w-[12rem]" />
              <div class="mt-2 flex items-center gap-2">
                <S class="h-4 w-14 rounded-full" />
                <S class="h-3 w-16" />
              </div>
            </div>
          </div>
          <div v-else-if="history.length === 0" class="text-center text-sm text-[var(--color-text-secondary)]">
            No suggestions yet.
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="s in history"
              :key="s.id"
              class="cursor-pointer rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="loadSuggestion(s)"
            >
              <p class="text-sm font-medium text-[var(--color-text-primary)] truncate">{{ s.subject }}</p>
              <div class="mt-1 flex items-center gap-2">
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                    s.status === 'sent'
                      ? 'bg-blue-50 text-blue-700 ring-blue-300'
                      : s.status === 'accepted'
                        ? 'bg-green-50 text-green-700 ring-green-300'
                        : s.status === 'rejected'
                          ? 'bg-red-50 text-red-700 ring-red-300'
                          : 'bg-yellow-50 text-yellow-700 ring-yellow-300',
                  ]"
                >
                  {{ s.status }}
                </span>
                <span class="text-xs text-[var(--color-text-secondary)]">
                  {{ new Date(s.createdAt).toLocaleDateString() }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
