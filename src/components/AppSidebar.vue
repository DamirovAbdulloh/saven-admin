<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  Users,
  Building2,
  CreditCard,
  Bell,
  PieChart,
  Settings,
  LogOut,
  PanelLeft,
} from 'lucide-vue-next'
import { useSidebar } from '@/composables/useSidebar'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
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
  { title: 'Sozlamalar', to: '/settings', icon: Settings },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleSignOut() {
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
      </ul>
    </nav>

    <div class="border-t border-sidebar-border p-2">
      <button
        @click="handleSignOut"
        class="w-full flex items-center gap-3 rounded-md p-2 text-sidebar-foreground/70 hover:bg-destructive/15 hover:text-destructive transition-colors"
      >
        <LogOut class="h-4 w-4" />
        <span v-if="!collapsed" class="text-sm">Chiqish</span>
      </button>
    </div>
  </aside>
</template>
