import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue') },
        { path: 'users/:id', name: 'user-detail', component: () => import('@/views/UserDetailView.vue') },
        { path: 'businesses', name: 'businesses', component: () => import('@/views/BusinessesView.vue') },
        {
          path: 'businesses/applications',
          name: 'applications',
          component: () => import('@/views/ApplicationsView.vue'),
        },
        {
          path: 'businesses/applications/:id',
          name: 'application-detail',
          component: () => import('@/views/ApplicationDetailView.vue'),
        },
        {
          path: 'businesses/:id',
          name: 'business-detail',
          component: () => import('@/views/BusinessDetailView.vue'),
        },
        { path: 'payments', name: 'payments', component: () => import('@/views/PaymentsView.vue') },
        {
          path: 'payments/:txn',
          name: 'payment-detail',
          component: () => import('@/views/PaymentDetailView.vue'),
        },
        { path: 'notifications', name: 'notifications', component: () => import('@/views/NotificationsView.vue') },
        { path: 'analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'auth' }
  }
  if (to.name === 'auth' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
