<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Search, Filter, Download, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import api from '@/api/client'
import { downloadTablePdf } from '@/lib/pdf'
import { toast } from '@/composables/useToast'

const router = useRouter()

const MEMBERSHIP_OPTIONS = ['Premium', "Muddati o'tgan", 'Free Trial', 'Bloklangan']
const ACTIVITY_OPTIONS = ['Faol', 'Nofaol']

const stats = ref({ total: 0, premium: 0, overdue: 0, new_this_month: 0 })
const rows = ref<any[]>([])
const loading = ref(true)
const count = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = ref('')
let searchTimer: number | undefined

// Filter popover state
const filterOpen = ref(false)
const fStatus = ref<string | null>(null)
const fActivity = ref<string | null>(null)
const fSavingsMin = ref<string>('0')
const fSavingsMax = ref<string>('500000')
const filterActive = ref(false)

async function loadStats() {
  const { data } = await api.get('/users/stats/')
  stats.value = data
}

async function loadRows() {
  loading.value = true
  try {
    const params: Record<string, any> = { search: search.value, page: page.value }
    if (filterActive.value) {
      if (fStatus.value) params.status = fStatus.value
      if (fActivity.value) params.activity = fActivity.value
      if (fSavingsMin.value) params.savings_min = fSavingsMin.value
      if (fSavingsMax.value) params.savings_max = fSavingsMax.value
    }
    const { data } = await api.get('/users/', { params })
    rows.value = data.results
    count.value = data.count
    pageSize.value = data.page_size ?? pageSize.value
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
  loadRows()
})

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    page.value = 1
    loadRows()
  }, 350)
})
watch(page, loadRows)

function applyFilter() {
  filterActive.value = true
  filterOpen.value = false
  page.value = 1
  loadRows()
}
function clearFilter() {
  fStatus.value = null
  fActivity.value = null
  fSavingsMin.value = '0'
  fSavingsMax.value = '500000'
  filterActive.value = false
  filterOpen.value = false
  page.value = 1
  loadRows()
}

const exporting = ref(false)
async function exportPdf() {
  exporting.value = true
  try {
    const { data } = await api.get('/users/export/')
    await downloadTablePdf({ filename: 'foydalanuvchilar.pdf', ...data })
    toast.success('PDF yuklab olindi')
  } catch {
    toast.error('Yuklab olishda xatolik yuz berdi')
  } finally {
    exporting.value = false
  }
}

function openProfile(row: any) {
  router.push(`/users/${row.id}`)
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="Foydalanuvchilar" subtitle="Barcha ro'yxatdan o'tgan foydalanuvchilar" />

    <!-- Colored stat cards (design: Jami / Premium / Muddati o'tgan / Yangi oy) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Jami" :value="stats.total.toLocaleString()" />
      <StatCard label="Premium" :value="stats.premium.toLocaleString()" variant="premium" />
      <StatCard label="Muddati o'tgan" :value="stats.overdue.toLocaleString()" variant="overdue" />
      <StatCard label="Yangi oy" :value="stats.new_this_month.toLocaleString()" variant="new" />
    </div>

    <div class="rounded-2xl bg-card border border-border p-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 class="text-foreground font-semibold text-lg">So'nggi a'zolar</h3>
        <div class="flex items-center gap-2 flex-1 justify-end">
          <div class="relative max-w-xs w-full">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="search"
              placeholder="Qidirish"
              class="w-full pl-9 h-10 rounded-xl bg-muted border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <!-- Filter popover -->
          <div class="relative" v-click-outside="() => (filterOpen = false)">
            <button
              @click="filterOpen = !filterOpen"
              :class="[
                'rounded-xl px-4 h-10 text-sm flex items-center gap-1.5 transition-colors',
                filterActive ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-muted hover:bg-accent text-foreground',
              ]"
            >
              Filtr <Filter class="h-4 w-4" :class="filterActive ? 'text-primary' : 'text-primary'" />
            </button>
            <div
              v-if="filterOpen"
              class="absolute right-0 mt-2 w-72 rounded-2xl bg-popover border border-border shadow-xl z-20 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-semibold text-foreground">Filtr</span>
                <button @click="clearFilter" class="text-xs text-muted-foreground hover:text-foreground">
                  Filtrni tozalash
                </button>
              </div>

              <div class="text-xs text-muted-foreground mb-2">A'zolik holati</div>
              <div class="space-y-1 mb-3">
                <label
                  v-for="s in MEMBERSHIP_OPTIONS"
                  :key="s"
                  class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer"
                >
                  <span
                    :class="[
                      'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                      fStatus === s ? 'border-primary' : 'border-muted-foreground/50',
                    ]"
                  >
                    <span v-if="fStatus === s" class="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <input type="radio" class="hidden" :value="s" v-model="fStatus" />
                  {{ s }}
                </label>
              </div>

              <div class="text-xs text-muted-foreground mb-2">Faollik holati</div>
              <div class="space-y-1 mb-3">
                <label
                  v-for="s in ACTIVITY_OPTIONS"
                  :key="s"
                  class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer"
                >
                  <span
                    :class="[
                      'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                      fActivity === s ? 'border-primary' : 'border-muted-foreground/50',
                    ]"
                  >
                    <span v-if="fActivity === s" class="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <input type="radio" class="hidden" :value="s" v-model="fActivity" />
                  {{ s }}
                </label>
              </div>

              <div class="text-xs text-muted-foreground mb-2">Tejash summasi (so'm)</div>
              <div class="flex items-center gap-2 mb-4">
                <input
                  v-model="fSavingsMin"
                  type="number"
                  min="0"
                  class="w-1/2 h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground"
                />
                <input
                  v-model="fSavingsMax"
                  type="number"
                  min="0"
                  class="w-1/2 h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground"
                />
              </div>

              <button
                @click="applyFilter"
                class="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Qo'llash
              </button>
            </div>
          </div>

          <button
            @click="exportPdf"
            :disabled="exporting"
            class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-10 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-70"
          >
            <Download class="h-4 w-4" /> {{ exporting ? 'Tayyorlanmoqda...' : 'Yuklash' }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div v-if="rows.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground text-xs bg-muted/50">
              <th class="text-left font-normal py-2.5 px-3 rounded-l-lg">#</th>
              <th class="text-left font-normal py-2.5 px-3">ID</th>
              <th class="text-left font-normal py-2.5 px-3">Foydalanuvchi</th>
              <th class="text-left font-normal py-2.5 px-3">Telefon</th>
              <th class="text-left font-normal py-2.5 px-3">A'zolik holati</th>
              <th class="text-left font-normal py-2.5 px-3">A'zo bo'lgan</th>
              <th class="text-left font-normal py-2.5 px-3">Jamg'arma</th>
              <th class="text-left font-normal py-2.5 px-3">Status</th>
              <th class="text-right font-normal py-2.5 px-3 rounded-r-lg">Profil</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in rows"
              :key="r.id"
              @click="openProfile(r)"
              class="border-t border-border/60 hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <td class="py-3 px-3 text-muted-foreground">{{ (page - 1) * pageSize + i + 1 }}</td>
              <td class="py-3 px-3 text-muted-foreground font-mono text-xs">{{ r.member_code }}</td>
              <td class="py-3 px-3 text-foreground font-medium">{{ r.name }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.phone }}</td>
              <td class="py-3 px-3">
                <StatusBadge :status="r.is_blocked ? 'Bloklangan' : r.status" />
              </td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.date }}</td>
              <td class="py-3 px-3 text-foreground font-medium">{{ r.savings }}</td>
              <td class="py-3 px-3"><StatusBadge :status="r.activity_status" /></td>
              <td class="py-3 px-3 text-right">
                <button
                  class="rounded-lg h-8 w-8 inline-flex items-center justify-center bg-muted hover:bg-accent transition-colors"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state (design: "Ma'lumot mavjud emas") -->
      <div v-else-if="!loading" class="py-32 text-center">
        <p class="text-foreground font-semibold text-lg">Ma'lumot mavjud emas</p>
      </div>
      <div v-else class="py-32 text-center text-muted-foreground text-sm">Yuklanmoqda...</div>

      <PaginationBar :count="count" :page="page" :page-size="pageSize" @update:page="page = $event" />
    </div>
  </div>
</template>
