<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as dashboardApi from '@/api/dashboard.api'
import type { DashboardStatsDTO, RecentActivityDTO } from '@pr-outreach/shared-types'
import { formatDate, formatRelativeDate } from '@/utils/date'
import DashboardSkeleton from '@/components/ui/skeletons/DashboardSkeleton.vue'

const router = useRouter()

const stats = ref<DashboardStatsDTO | null>(null)
const activity = ref<RecentActivityDTO[]>([])
const loading = ref(true)
const error = ref('')

const statCards = [
  { key: 'totalContacts' as const, label: 'Total Contacts', icon: '👤', color: 'bg-blue-50 text-blue-700' },
  { key: 'activeCampaigns' as const, label: 'Active Campaigns', icon: '📢', color: 'bg-green-50 text-green-700' },
  { key: 'emailsSent' as const, label: 'Emails Sent', icon: '📧', color: 'bg-purple-50 text-purple-700' },
  { key: 'repliesReceived' as const, label: 'Replies', icon: '💬', color: 'bg-yellow-50 text-yellow-700' },
  { key: 'responseRate' as const, label: 'Response Rate', icon: '📊', color: 'bg-indigo-50 text-indigo-700', suffix: '%' },
  { key: 'draftsPendingReview' as const, label: 'Drafts Pending', icon: '✏️', color: 'bg-orange-50 text-orange-700' },
]

const activityIcons: Record<string, string> = {
  contact_created: '👤',
  campaign_created: '📢',
  draft_generated: '🤖',
  email_sent: '📧',
  reply_received: '💬',
}

onMounted(async () => {
  try {
    const [s, a] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRecentActivity(),
    ])
    stats.value = s
    activity.value = a
  } catch (err: any) {
    error.value = err.message ?? 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
        <p class="mt-1 text-sm text-[var(--color-text-secondary)]">Your PR Outreach Intelligence overview.</p>
      </div>
      <button
        class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        @click="router.push({ name: 'outreach' })"
      >
        + New Draft
      </button>
    </div>

    <!-- Loading / Error -->
    <DashboardSkeleton v-if="loading" />
    <div v-else-if="error" class="rounded-lg bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">{{ error }}</div>

    <template v-else-if="stats">
      <!-- Stat cards -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div class="flex items-center gap-2">
            <span :class="['flex h-8 w-8 items-center justify-center rounded-lg text-sm', card.color]">
              {{ card.icon }}
            </span>
            <p class="text-xs font-medium uppercase text-[var(--color-text-secondary)]">{{ card.label }}</p>
          </div>
          <p class="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
            {{ stats[card.key] }}{{ card.suffix ?? '' }}
          </p>
        </div>
      </div>

      <!-- Quick actions + Recent activity -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Quick actions -->
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
          <div class="space-y-2">
            <button
              class="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="router.push({ name: 'outreach' })"
            >
              <span>🤖</span>
              <span class="font-medium text-[var(--color-text-primary)]">Generate AI Draft</span>
            </button>
            <button
              class="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="router.push({ name: 'contacts' })"
            >
              <span>👤</span>
              <span class="font-medium text-[var(--color-text-primary)]">Manage Contacts</span>
            </button>
            <button
              class="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
              @click="router.push({ name: 'campaigns' })"
            >
              <span>📢</span>
              <span class="font-medium text-[var(--color-text-primary)]">View Campaigns</span>
            </button>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h2>

          <div v-if="activity.length === 0" class="text-center text-sm text-[var(--color-text-secondary)] py-8">
            No recent activity yet. Start by creating a contact or campaign.
          </div>

          <ul v-else class="space-y-3">
            <li
              v-for="item in activity"
              :key="item.id"
              class="flex items-start gap-3 border-b border-[var(--color-border)] pb-3 last:border-0"
            >
              <span class="mt-0.5 text-base">{{ activityIcons[item.type] ?? '📌' }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-[var(--color-text-primary)]">{{ item.title }}</p>
                <p v-if="item.description" class="text-xs text-[var(--color-text-secondary)] truncate">{{ item.description }}</p>
              </div>
              <span class="shrink-0 text-xs text-[var(--color-text-secondary)]" :title="formatDate(item.createdAt)">{{ formatRelativeDate(item.createdAt) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
