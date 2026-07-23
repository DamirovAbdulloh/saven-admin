<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Copy, LogOut } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import logoIcon from '@/assets/logo-savin-icon.svg'

const router = useRouter()
const auth = useAuthStore()

const tab = ref<'help'>('help')
const logoutOpen = ref(false)

const SUPPORT_PHONE = '+998 93 242 59 99'

function copyPhone() {
  navigator.clipboard.writeText(SUPPORT_PHONE.replace(/\s/g, ''))
  toast.success('Raqam nusxalandi')
}

async function handleSignOut() {
  await auth.logout()
  toast.success('Chiqildi')
  router.replace({ name: 'auth' })
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="Sozlamalar" />

    <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
      <!-- Left menu -->
      <div class="space-y-2">
        <button
          @click="tab = 'help'"
          :class="[
            'w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'help' ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-muted text-foreground hover:bg-accent',
          ]"
        >
          <Phone class="h-4 w-4" /> Yordam
        </button>
        <button
          @click="logoutOpen = true"
          class="w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 transition-colors"
        >
          <LogOut class="h-4 w-4" /> Chiqish
        </button>
      </div>

      <!-- Support card -->
      <div
        class="rounded-2xl border border-border p-8 flex flex-col items-center text-center relative overflow-hidden"
        style="background: radial-gradient(ellipse at bottom, oklch(0.35 0.15 145 / 0.35), var(--color-card) 70%)"
      >
        <div class="w-16 h-16 rounded-2xl bg-muted mb-5 flex items-center justify-center">
          <img :src="logoIcon" alt="savin" class="h-9 w-9" />
        </div>
        <h2 class="text-2xl font-bold text-foreground mb-2">Qo'llab-quvvatlash</h2>
        <p class="text-sm text-muted-foreground max-w-sm mb-6">
          Agar sizga texnik yordam kerak bo'lsa, qo'llab-quvvatlash jamoamizga murojaat qiling.
        </p>
        <button
          @click="copyPhone"
          class="flex items-center gap-3 px-5 py-3 rounded-full bg-muted/80 hover:bg-accent transition-colors mb-8"
        >
          <span class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Phone class="h-4 w-4 text-primary-foreground" />
          </span>
          <span class="text-foreground font-medium">{{ SUPPORT_PHONE }}</span>
          <Copy class="h-4 w-4 text-muted-foreground" />
        </button>

        <!-- Phone mockup -->
        <div class="w-52 rounded-[2rem] bg-[oklch(0.12_0.005_260)] border-4 border-[oklch(0.25_0.01_260)] p-4 pt-6 shadow-2xl">
          <div class="flex items-center justify-between text-[10px] text-muted-foreground mb-6 px-1">
            <span>16:41</span>
            <span class="h-4 w-16 rounded-full bg-[oklch(0.2_0.005_260)]" />
            <span>••• 5G</span>
          </div>
          <div class="text-foreground text-lg font-medium mb-6">+998 93-573-03-01</div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" class="h-10 w-10 mx-auto rounded-full bg-[oklch(0.2_0.005_260)] flex items-center justify-center text-foreground text-sm">
              {{ n }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout confirmation -->
    <AppModal
      v-if="logoutOpen"
      tone="red"
      title="Tizimdan chiqishni xohlaysizmi?"
      :closable="true"
      @close="logoutOpen = false"
    >
      <template #icon><LogOut class="h-6 w-6 text-white" /></template>
      <template #actions>
        <button
          @click="logoutOpen = false"
          class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
        >
          Orqaga
        </button>
        <button
          @click="handleSignOut"
          class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Chiqish
        </button>
      </template>
    </AppModal>
  </div>
</template>
