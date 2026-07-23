<script setup lang="ts">
import { onMounted } from 'vue'
import { Bell, PanelLeft } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useSidebar } from '@/composables/useSidebar'

const auth = useAuthStore()
const { toggle } = useSidebar()

onMounted(() => {
  if (!auth.user) auth.fetchMe()
})
</script>

<template>
  <div class="min-h-screen flex w-full bg-background">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <header class="h-14 flex items-center justify-between border-b border-border bg-card/50 px-4 md:hidden">
        <button @click="toggle" class="h-7 w-7 inline-flex items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors">
          <PanelLeft class="h-4 w-4" />
        </button>
        <button class="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-muted transition-colors">
          <Bell class="h-5 w-5" />
        </button>
      </header>
      <main class="flex-1 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
