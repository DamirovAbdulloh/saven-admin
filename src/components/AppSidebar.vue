<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  Users,
  Building2,
  CreditCard,
  Bell,
  PieChart,
  LogOut,
  PanelLeft,
} from 'lucide-vue-next'
import { useSidebar } from '@/composables/useSidebar'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import AppModal from '@/components/AppModal.vue'
import logoFull from '@/assets/logo-savin.svg'
import logoIcon from '@/assets/logo-savin-icon.svg'

const { collapsed, toggle } = useSidebar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const items = [
  { title: 'Bosh sahifa', to: '/', icon: Home },
  { title: 'Foydalanuvchilar', to: '/users', icon: Users },
  { title: 'Bizneslar', to: '/businesses', icon: Building2 },
  { title: "To'lovlar", to: '/payments', icon: CreditCard },
  { title: 'Bildirishnomalar', to: '/notifications', icon: Bell },
  { title: 'Analitika', to: '/analytics', icon: PieChart },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// "Chiqish" bosilganda avval tasdiqlash oynasi ochiladi (to'g'ridan-to'g'ri
// chiqib ketmaydi) — foydalanuvchi tasdiqlasa yoki bekor qilsa.
const showLogoutConfirm = ref(false)

async function confirmSignOut() {
  showLogoutConfirm.value = false
  await auth.logout()
  toast.success('Chiqildi')
  router.replace({ name: 'auth' })
}
</script>

<template>
  <!-- shadcn ui/sidebar.tsx: SIDEBAR_WIDTH = 16rem (w-64), SIDEBAR_WIDTH_ICON = 3rem (w-12) -->
  <aside
    :class="[
      'sidebar-width h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0',
      collapsed ? 'w-12' : 'w-64',
    ]"
  >
    <div class="border-b border-sidebar-border">
      <div class="flex items-center justify-between px-2 py-3">
        <RouterLink v-if="!collapsed" to="/" class="flex items-center px-1">
          <img :src="logoFull" alt="savin" class="h-7 w-auto" />
        </RouterLink>
        <RouterLink v-else to="/" class="mx-auto">
          <img :src="logoIcon" alt="savin" class="h-7 w-7" />
        </RouterLink>
        <!-- SidebarTrigger: ghost, size-icon (h-7 w-7), PanelLeft icon — rendered unconditionally,
             same as the original (not hidden when collapsed). -->
        <button
          @click="toggle"
          class="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <PanelLeft class="h-4 w-4" />
        </button>
      </div>
    </div>

    <nav class="px-2 py-3 flex-1">
      <ul class="space-y-1">
        <li v-for="item in items" :key="item.title">
          <RouterLink
            :to="item.to"
            :class="[
              'flex items-center gap-3 rounded-md p-2 transition-[width,height,padding]',
              isActive(item.to)
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            ]"
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            <span v-if="!collapsed" class="text-sm">{{ item.title }}</span>
          </RouterLink>
        </li>

        <!-- "Chiqish" — Sozlamalar o'rnida. Bosilganda tasdiqlash oynasi chiqadi. -->
        <li>
          <button
            @click="showLogoutConfirm = true"
            class="w-full flex items-center gap-3 rounded-md p-2 text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive transition-colors"
          >
            <LogOut class="h-4 w-4 shrink-0" />
            <span v-if="!collapsed" class="text-sm">Chiqish</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>

  <!-- Tizimdan chiqishni tasdiqlash oynasi -->
  <AppModal
    v-if="showLogoutConfirm"
    tone="red"
    title="Rostdan ham chiqmoqchimisiz?"
    subtitle="Tizimdan chiqasiz va keyingi safar qaytadan login qilishingiz kerak bo'ladi."
    @close="showLogoutConfirm = false"
  >
    <template #icon>
      <LogOut class="h-6 w-6 text-white" />
    </template>
    <template #actions>
      <button
        @click="showLogoutConfirm = false"
        class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
      >
        Bekor qilish
      </button>
      <button
        @click="confirmSignOut"
        class="rounded-xl bg-destructive text-white hover:bg-destructive/90 px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        Chiqish
      </button>
    </template>
  </AppModal>
</template>
