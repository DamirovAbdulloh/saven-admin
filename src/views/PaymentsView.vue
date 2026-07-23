<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bar } from 'vue-chartjs'
import { Search, Filter, Download, ChevronRight, CalendarDays } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import api from '@/api/client'
import { PRIMARY, axisTicks, gridLines, baseTooltip } from '@/lib/chartTheme'
import { downloadTablePdf } from '@/lib/pdf'
import { toast } from '@/composables/useToast'

const router = useRouter()

const STATUS_OPTIONS = ['Muvaffaqiyatli', 'Kutilmoqda', 'Qaytarilgan']
const METHOD_OPTIONS = ['Click', 'Payme', 'Humo/Uzcard']
const METHOD_COLORS: Record<string, string> = {
  Click: 'oklch(0.6 0.19 250)',
  Payme: 'oklch(0.75 0.18 155)',
  'Humo/Uzcard': 'oklch(0.8 0.15 75)',
}

const stats = ref({ this_month: '—', last_month: '—', total_count: '—', refund_count: 0, refund_sum: '' })
const monthly = ref<any[]>([])
const methods = ref<any[]>([])
const rows = ref<any[]>([])
const loading = ref(true)
const count = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = ref('')
let searchTimer: number | undefined

const filterOpen = ref(false)
const rangeOpen = ref(false)
const fStatus = ref<string | null>(null)
const fMethod = ref<string | null>(null)
const fStart = ref('')
const fEnd = ref('')
const filterActive = ref(false)

const rangeLabel = computed(() => {
  const fmt = (iso: string) => {
    if (!iso) return 'kk.oo.yyyy'
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
  }
  return `${fmt(fStart.value)} – ${fmt(fEnd.value)}`
})

async function loadStats() {
  const { data } = await api.get('/payments/stats/')
  stats.value = data
}
async function loadCharts() {
  const { data } = await api.get('/payments/charts/')
  monthly.value = data.monthly
  methods.value = data.methods
}
async function loadRows() {
  loading.value = true
  try {
    const params: Record<string, any> = { search: search.value, page: page.value }
    if (filterActive.value) {
      if (fStatus.value) params.status = fStatus.value
      if (fMethod.value) params.method = fMethod.value
      if (fStart.value) params.start = fStart.value
      if (fEnd.value) params.end = fEnd.value
    }
    const { data } = await api.get('/payments/', { params })
    rows.value = data.results
    count.value = data.count
    pageSize.value = data.page_size ?? pageSize.value
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  loadStats()
  loadCharts()
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
  fMethod.value = null
  fStart.value = ''
  fEnd.value = ''
  filterActive.value = false
  filterOpen.value = false
  page.value = 1
  loadRows()
}
const exporting = ref(false)
async function exportPdf() {
  exporting.value = true
  try {
    const { data } = await api.get('/payments/export/')
    await downloadTablePdf({ filename: 'tolovlar.pdf', ...data })
    toast.success('PDF yuklab olindi')
  } catch {
    toast.error('Yuklab olishda xatolik yuz berdi')
  } finally {
    exporting.value = false
  }
}
function openDetail(p: any) {
  router.push(`/payments/${p.txn_id}`)
}

// --- Monthly revenue bar chart ---
const monthlyData = computed(() => ({
  labels: monthly.value.map((m) => m.month),
  datasets: [
    {
      data: monthly.value.map((m) => m.value),
      backgroundColor: PRIMARY,
      borderRadius: 6,
      maxBarThickness: 40,
    },
  ],
}))
const monthlyOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...baseTooltip,
      callbacks: {
        title: (items: any[]) => monthly.value[items[0].dataIndex]?.month ?? '',
        label: () => '',
        afterBody: (items: any[]) => {
          const m = monthly.value[items[0].dataIndex]
          if (!m) return ''
          const lines = [`Jami: ${m.value.toLocaleString()} so'm`]
          for (const [method, val] of Object.entries(m.by_method)) {
            lines.push(`${method}: ${Number(val).toLocaleString()} so'm`)
          }
          return lines
        },
      },
    },
  },
  scales: {
    x: { grid: gridLines(false), ticks: axisTicks() },
    y: { grid: gridLines(true), ticks: { ...axisTicks(), callback: (v: any) => `${v / 1_000_000}M` } },
  },
}))

// --- Payment method donut (CSS conic-gradient) ---
const donutGradient = computed(() => {
  let acc = 0
  const stops: string[] = []
  for (const m of methods.value) {
    const start = acc
    acc += m.pct
    stops.push(`${METHOD_COLORS[m.method]} ${start}% ${acc}%`)
  }
  return `conic-gradient(${stops.join(', ')})`
})
const topMethod = computed(() => methods.value.slice().sort((a, b) => b.pct - a.pct)[0])
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="To'lovlar" subtitle="Barcha to'lovlar tarixi va statistikasi" />

    <!-- Stat cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Bu oylik daromad" :value="stats.this_month" variant="premium" />
      <StatCard label="O'tgan oy" :value="stats.last_month" />
      <StatCard label="Jami tranzaksiya" :value="stats.total_count" variant="new" />
      <StatCard label="Qayta so'rovlar" :value="String(stats.refund_count)" :hint="stats.refund_sum" variant="overdue" />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-card border border-border p-5">
        <h3 class="text-foreground font-semibold mb-4">Oylik Daromad</h3>
        <div class="h-64"><Bar v-if="monthly.length" :data="monthlyData" :options="monthlyOptions" /></div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-5">
        <h3 class="text-foreground font-semibold mb-4">To'lov usullari</h3>
        <div class="flex items-center gap-8">
          <div class="relative h-40 w-40 shrink-0">
            <div class="h-full w-full rounded-full" :style="{ background: donutGradient }" />
            <div class="absolute inset-[22%] rounded-full bg-card flex flex-col items-center justify-center">
              <span class="text-xl font-bold text-foreground">{{ topMethod?.pct ?? 0 }}%</span>
              <span class="text-xs text-muted-foreground">{{ topMethod?.method }}</span>
            </div>
          </div>
          <div class="flex-1 space-y-3">
            <div v-for="m in methods" :key="m.method">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="flex items-center gap-2 text-foreground">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: METHOD_COLORS[m.method] }" />
                  {{ m.method }}
                </span>
                <span class="text-muted-foreground">{{ m.pct }}%</span>
              </div>
              <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                <div class="h-full rounded-full" :style="{ width: m.pct + '%', background: METHOD_COLORS[m.method] }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions table -->
    <div class="rounded-2xl bg-card border border-border p-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 class="text-foreground font-semibold text-lg">So'nggi tranzaksiyalar</h3>
        <div class="flex items-center gap-2 flex-1 justify-end">
          <div class="relative max-w-xs w-full">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="search"
              placeholder="Qidirish"
              class="w-full pl-9 h-10 rounded-xl bg-muted border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="relative">
            <button
              @click="filterOpen = !filterOpen"
              :class="[
                'rounded-xl px-4 h-10 text-sm flex items-center gap-1.5 transition-colors',
                filterActive ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-muted hover:bg-accent text-foreground',
              ]"
            >
              Filtr <Filter class="h-4 w-4 text-primary" />
            </button>
            <div v-if="filterOpen" class="absolute right-0 mt-2 w-72 rounded-2xl bg-popover border border-border shadow-xl z-20 p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-semibold text-foreground">Filtr</span>
                <button @click="clearFilter" class="text-xs text-muted-foreground hover:text-foreground">Filtrni tozalash</button>
              </div>

              <div class="text-xs text-muted-foreground mb-2">Holat</div>
              <div class="space-y-1 mb-3">
                <label v-for="s in STATUS_OPTIONS" :key="s" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer">
                  <span :class="['h-4 w-4 rounded-full border-2 flex items-center justify-center', fStatus === s ? 'border-primary' : 'border-muted-foreground/50']">
                    <span v-if="fStatus === s" class="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <input type="radio" class="hidden" :value="s" v-model="fStatus" />
                  {{ s }}
                </label>
              </div>

              <div class="text-xs text-muted-foreground mb-2">To'lov usuli</div>
              <div class="space-y-1 mb-3">
                <label v-for="m in METHOD_OPTIONS" :key="m" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer">
                  <span :class="['h-4 w-4 rounded-full border-2 flex items-center justify-center', fMethod === m ? 'border-primary' : 'border-muted-foreground/50']">
                    <span v-if="fMethod === m" class="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <input type="radio" class="hidden" :value="m" v-model="fMethod" />
                  {{ m }}
                </label>
              </div>

              <div class="text-xs text-muted-foreground mb-2">Sana oralig'i</div>
              <div class="relative mb-4">
                <button
                  @click="rangeOpen = !rangeOpen"
                  class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-xs text-foreground flex items-center justify-between"
                >
                  <span>{{ rangeLabel }}</span>
                  <CalendarDays class="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <div v-if="rangeOpen" class="absolute right-0 top-full mt-1 z-30">
                  <DateRangePicker
                    :start="fStart"
                    :end="fEnd"
                    @apply="(s: string, e: string) => { fStart = s; fEnd = e; rangeOpen = false }"
                    @cancel="rangeOpen = false"
                    @clear="fStart = ''; fEnd = ''; rangeOpen = false"
                  />
                </div>
              </div>

              <button @click="applyFilter" class="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
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

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground text-xs bg-muted/50">
              <th class="text-left font-normal py-2.5 px-3 rounded-l-lg">ID</th>
              <th class="text-left font-normal py-2.5 px-3">Foydalanuvchi</th>
              <th class="text-left font-normal py-2.5 px-3">Summa</th>
              <th class="text-left font-normal py-2.5 px-3">To'lov usul</th>
              <th class="text-left font-normal py-2.5 px-3">Sana</th>
              <th class="text-left font-normal py-2.5 px-3">Holat</th>
              <th class="text-right font-normal py-2.5 px-3 rounded-r-lg">Profil</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in rows" :key="p.txn_id" @click="openDetail(p)" class="border-t border-border/60 hover:bg-muted/40 cursor-pointer transition-colors">
              <td class="py-3 px-3 text-foreground font-mono text-xs">{{ p.txn_id }}</td>
              <td class="py-3 px-3 text-foreground">{{ p.user_display_name }}</td>
              <td class="py-3 px-3 text-foreground font-medium">{{ p.amount_fmt }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ p.method }}</td>
              <td class="py-3 px-3 text-muted-foreground text-xs">{{ p.date }}</td>
              <td class="py-3 px-3"><StatusBadge :status="p.status" /></td>
              <td class="py-3 px-3 text-right">
                <button class="rounded-lg h-8 w-8 inline-flex items-center justify-center bg-muted hover:bg-accent transition-colors">
                  <ChevronRight class="h-4 w-4" />
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading">
              <td colspan="7" class="py-8 text-center text-muted-foreground text-sm">Hech narsa topilmadi</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationBar :count="count" :page="page" :page-size="pageSize" @update:page="page = $event" />
    </div>
  </div>
</template>
