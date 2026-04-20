<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContactsStore } from '@/stores/contacts.store'
import { useCampaignsStore } from '@/stores/campaigns.store'
import { useNotifications } from '@/composables/useNotifications'
import * as aiApi from '@/api/ai.api'
import * as messagingApi from '@/api/messaging.api'
import type { GenerateOutreachResponseDTO, AISuggestionDTO } from '@pr-outreach/shared-types'

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
const suggestionId = ref<number | null>(null)
const editSubject = ref('')
const editBody = ref('')

// ── History ──
const history = ref<AISuggestionDTO[]>([])
const historyLoading = ref(false)

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
  try {
    const res = await aiApi.generateOutreach({
      contactId: selectedContactId.value,
      campaignId: selectedCampaignId.value,
      tone: tone.value,
      length: length.value,
    })
    result.value = res
    suggestionId.value = res.suggestionId
    editSubject.value = res.subject
    editBody.value = res.body
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
    notify({ type: 'info', message: 'Draft rejected' })
    await loadHistory()
  } catch (err: any) {
    notify({ type: 'error', message: err.message ?? 'Failed to reject draft' })
  }
}

async function sendEmail() {
  if (!suggestionId.value || !selectedContactId.value) return
  sending.value = true
  try {
    await messagingApi.sendEmail({
      contactId: selectedContactId.value,
      campaignId: selectedCampaignId.value ?? undefined,
      subject: editSubject.value,
      body: editBody.value,
      aiSuggestionId: suggestionId.value,
    })
    draftAccepted.value = false
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
  draftAccepted.value = s.status === 'accepted'
  result.value = {
    suggestionId: s.id,
    subject: s.subject,
    body: s.body,
    model: s.model ?? '',
    promptVersion: s.promptVersion ?? '',
  }
}

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
      <h1 class="text-2xl font-bold text-gray-900">AI Outreach Draft</h1>
      <p class="mt-1 text-sm text-gray-600">Generate AI-assisted email drafts for your PR contacts.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left: Form -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Configuration card -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">Configure Draft</h2>

          <!-- Contact -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Contact</label>
            <select
              v-model="selectedContactId"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option :value="null" disabled>Select a contact…</option>
              <option
                v-for="c in contactsStore.items"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }} — {{ c.outlet }}
              </option>
            </select>
          </div>

          <!-- Campaign -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Campaign</label>
            <select
              v-model="selectedCampaignId"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option :value="null" disabled>Select a campaign…</option>
              <option
                v-for="c in campaignsStore.items"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }}
              </option>
            </select>
          </div>

          <!-- Tone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tone</label>
            <div class="flex gap-2">
              <label
                v-for="opt in toneOptions"
                :key="opt.value"
                :class="[
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  tone === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                ]"
              >
                <input v-model="tone" type="radio" :value="opt.value" class="sr-only" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Length -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Length</label>
            <div class="flex gap-2">
              <label
                v-for="opt in lengthOptions"
                :key="opt.value"
                :class="[
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  length === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                ]"
              >
                <input v-model="length" type="radio" :value="opt.value" class="sr-only" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error }}
          </div>

          <!-- Generate button -->
          <button
            :disabled="generating || !selectedContactId || !selectedCampaignId"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            @click="generate"
          >
            {{ generating ? 'Generating…' : 'Generate Draft' }}
          </button>
        </div>

        <!-- Result card -->
        <div v-if="result" class="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div class="flex items-start justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Generated Draft</h2>
            <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {{ result.model }} · {{ result.promptVersion }}
            </span>
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Subject</label>
            <input
              v-model="editSubject"
              type="text"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Body -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Body</label>
            <textarea
              v-model="editBody"
              rows="10"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              v-if="draftAccepted"
              :disabled="sending"
              class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              @click="sendEmail"
            >
              {{ sending ? 'Sending…' : '📧 Send Email' }}
            </button>
            <button
              v-if="!draftAccepted"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              @click="acceptDraft"
            >
              Accept Draft
            </button>
            <button
              class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              @click="rejectDraft"
            >
              Reject
            </button>
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="generate"
              :disabled="generating"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <!-- Right: History -->
      <div class="space-y-4">
        <div class="rounded-lg border border-gray-200 bg-white p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Suggestions</h2>

          <div v-if="historyLoading" class="text-center text-sm text-gray-500">Loading…</div>
          <div v-else-if="history.length === 0" class="text-center text-sm text-gray-500">
            No suggestions yet.
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="s in history"
              :key="s.id"
              class="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              @click="loadSuggestion(s)"
            >
              <p class="text-sm font-medium text-gray-900 truncate">{{ s.subject }}</p>
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
                <span class="text-xs text-gray-500">
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
