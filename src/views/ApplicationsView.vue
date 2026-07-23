<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const router = useRouter()
const rows = ref<any[]>([])
const counts = ref({ all: 0, new: 0, reviewing: 0, contacted: 0 })
const loading = ref(true)
const openMenu = ref<number | null>(null)

// Qator bosilganda ariza detail sahifasi ochiladi (biznes detail kabi)
function openDetail(r: any) {
  router.push(`/businesses/applications/${r.id}`)
}

const STATUS_FLOW = ['Yangi', "Ko'rib chiqilmoqda", "Bog'lanildi", 'Tasdiqlangan', 'Rad etildi']

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/applications/')
    rows.value = data.results
    counts.value = data.counts
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function setStatus(app: any, status: string) {
  openMenu.value = null
  try {
    const { data } = await api.patch(`/applications/${app.id}/`, { status })
    Object.assign(app, data)
    toast.success('Holat yangilandi')
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="Arizalar" subtitle="Landing saytdan kelgan arizalar" />

    <!-- Status flow legend -->
    <div class="rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm text-primary flex items-center gap-2 flex-wrap">
      <span class="text-muted-foreground">Status oqimi:</span>
      <template v-for="(s, i) in STATUS_FLOW" :key="s">
        <span>{{ s }}</span>
        <ChevronRight v-if="i < STATUS_FLOW.length - 1" class="h-3.5 w-3.5 text-muted-foreground" />
      </template>
    </div>

    <div class="rounded-2xl bg-card border border-border p-5">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 class="text-foreground font-semibold text-lg">Landing sahifasidan kelgan arizalar</h3>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">Barchasi: <span class="text-foreground font-semibold">{{ counts.all }}</span></span>
          <span class="text-muted-foreground">Yangi: <span class="text-[oklch(0.75_0.15_250)] font-semibold">{{ counts.new }}</span></span>
          <span class="text-muted-foreground">Ko'rib chiqilmoqda: <span class="text-[oklch(0.8_0.14_65)] font-semibold">{{ counts.reviewing }}</span></span>
          <span class="text-muted-foreground">Bog'lanildi: <span class="text-primary font-semibold">{{ counts.contacted }}</span></span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground text-xs bg-muted/50">
              <th class="text-left font-normal py-2.5 px-3 rounded-l-lg">#</th>
              <th class="text-left font-normal py-2.5 px-3">Biznes nomi</th>
              <th class="text-left font-normal py-2.5 px-3">Kategoriya</th>
              <th class="text-left font-normal py-2.5 px-3">Telefon</th>
              <th class="text-left font-normal py-2.5 px-3">Viloyat</th>
              <th class="text-left font-normal py-2.5 px-3">Chegirma</th>
              <th class="text-left font-normal py-2.5 px-3">Sana</th>
              <th class="text-left font-normal py-2.5 px-3 rounded-r-lg">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in rows"
              :key="r.id"
              @click="openDetail(r)"
              class="border-t border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <td class="py-3 px-3 text-muted-foreground">{{ i + 1 }}</td>
              <td class="py-3 px-3 text-foreground font-medium">{{ r.business_name }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.category }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.phone }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.region }}</td>
              <td class="py-3 px-3">
                <span class="inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium">{{ r.discount_percent }}%</span>
              </td>
              <td class="py-3 px-3 text-muted-foreground text-xs">{{ r.when }}</td>
              <!-- @click.stop — status menyusi bosilganda qator navigatsiyasi ishlamasin -->
              <td class="py-3 px-3 relative" @click.stop>
                <button
                  @click="openMenu = openMenu === r.id ? null : r.id"
                  class="inline-flex items-center gap-1"
                >
                  <StatusBadge :status="r.status" />
                  <ChevronDown class="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <div
                  v-if="openMenu === r.id"
                  class="absolute right-0 top-full mt-1 w-44 rounded-xl bg-popover border border-border shadow-lg z-20 p-1"
                >
                  <button
                    v-for="s in STATUS_FLOW"
                    :key="s"
                    @click="setStatus(r, s)"
                    class="w-full text-left rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {{ s }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading">
              <td colspan="8" class="py-16 text-center text-muted-foreground">Arizalar yo'q</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
