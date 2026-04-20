import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ── Public routes ──
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true },
    },
    // ── Protected routes ──
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: () => import('@/views/contacts/ContactsListView.vue'),
    },
    {
      path: '/contacts/:id',
      name: 'contact-detail',
      component: () => import('@/views/contacts/ContactDetailView.vue'),
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: () => import('@/views/campaigns/CampaignsListView.vue'),
    },
    {
      path: '/campaigns/:id',
      name: 'campaign-detail',
      component: () => import('@/views/campaigns/CampaignDetailView.vue'),
    },
    {
      path: '/outreach',
      name: 'outreach',
      component: () => import('@/views/outreach/OutreachDraftView.vue'),
    },
    // ── Catch-all ──
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

let initialized = false

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!initialized) {
    initialized = true
    await auth.tryRestore()
  }

  const isGuest = to.meta.guest === true

  if (!isGuest && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (isGuest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
