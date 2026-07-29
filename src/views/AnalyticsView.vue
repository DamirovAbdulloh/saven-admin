<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Filter, Download, Clock, MapPin, TrendingUp, CalendarDays } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import api from '@/api/client'
import { axisTicks, gridLines, baseTooltip, PRIMARY, PRIMARY_ALT, TOOLTIP_TEXT } from '@/lib/chartTheme'
import { downloadTablePdf } from '@/lib/pdf'
import { toast } from '@/composables/useToast'

const data = ref<any>(null)
const loading = ref(true)

const filterOpen = ref(false)
const rangeOpen = ref(false)
const period = ref<'hafta' | 'oy' | 'jami'>('oy')
const fStart = ref('')
const fEnd = ref('')
const fCategory = ref('')
const fRegion = ref('')

const rangeLabel = computed(() => {
  const fmt = (iso: string) => {
    if (!iso) return 'kk.oo.yyyy'
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
  }
  return `${fmt(fStart.value)} – ${fmt(fEnd.value)}`
})

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { period: period.value }
    if (fStart.value) params.start = fStart.value
    if (fEnd.value) params.end = fEnd.value
    if (fCategory.value) params.category = fCategory.value
    if (fRegion.value) params.region = fRegion.value
    const { data: d } = await api.get('/analytics/', { params })
    data.value = d
  } finally {
    loading.value = false
  }
}
onMounted(load)

function applyFilter() {
  filterOpen.value = false
  load()
}
function clearFilter() {
  period.value = 'oy'
  fStart.value = ''
  fEnd.value = ''
  fCategory.value = ''
  fRegion.value = ''
  filterOpen.value = false
  load()
}
const exporting = ref(false)
async function exportPdf() {
  exporting.value = true
  try {
    const { data: payload } = await api.get('/analytics/export/')
    await downloadTablePdf({ filename: 'analitika.pdf', ...payload })
    toast.success('PDF yuklab olindi')
  } catch {
    toast.error('Yuklab olishda xatolik yuz berdi')
  } finally {
    exporting.value = false
  }
}

function fmtSom(v: number) {
  return v.toLocaleString('en-US').replace(/,/g, ' ') + " so'm"
}
function fmtBig(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + 'M so\'m'
  return fmtSom(v)
}

// Activity grouped bar chart (monthly + daily)
const activityData = computed(() => ({
  labels: (data.value?.activity ?? []).map((a: any) => a.label),
  datasets: [
    { label: 'Oylik', data: (data.value?.activity ?? []).map((a: any) => a.monthly), backgroundColor: PRIMARY_ALT, borderRadius: 4 },
    { label: 'Kunlik', data: (data.value?.activity ?? []).map((a: any) => a.daily), backgroundColor: PRIMARY, borderRadius: 4 },
  ],
}))
const activityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const, align: 'end' as const, labels: { color: TOOLTIP_TEXT, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } },
    tooltip: baseTooltip,
  },
  scales: { x: { grid: gridLines(false), ticks: axisTicks() }, y: { grid: gridLines(true), ticks: axisTicks() } },
}

const maxCatVisits = computed(() =>
  Math.max(1, ...(data.value?.categories ?? []).map((c: any) => c.visits)),
)
const maxSaving = computed(() =>
  Math.max(1, ...(data.value?.savings.by_category ?? []).map((c: any) => c.saved)),
)

// v-for indeksi TS'da string | number bo'lishi mumkin — build xatosi bermasligi uchun
const hoveredCat = ref<number | string | null>(null)
</script>

<template>
  <div v-if="data" class="p-6 md:p-8 space-y-6">
    <PageHeader title="Analitika" subtitle="Platforma faoliyati bo'yicha chuqur tahlil">
      <template #actions>
        <div class="relative" v-click-outside="() => (filterOpen = false)">
          <button
            @click="filterOpen = !filterOpen"
            class="rounded-xl bg-primary/15 text-primary border border-primary/40 px-4 h-10 text-sm flex items-center gap-1.5"
          >
            Filtr <Filter class="h-4 w-4" />
          </button>
          <div v-if="filterOpen" class="absolute right-0 mt-2 w-72 rounded-2xl bg-popover border border-border shadow-xl z-30 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-semibold text-foreground">Filtr</span>
              <button @click="clearFilter" class="text-xs text-muted-foreground hover:text-foreground">Filtrni tozalash</button>
            </div>
            <div class="text-xs text-muted-foreground mb-2">Sana oralig'i</div>
            <div class="relative mb-3" v-click-outside="() => (rangeOpen = false)">
              <button
                @click="rangeOpen = !rangeOpen"
                class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-xs text-foreground flex items-center justify-between"
              >
                <span>{{ rangeLabel }}</span>
                <CalendarDays class="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <div v-if="rangeOpen" class="absolute right-0 top-full mt-1 z-40">
                <DateRangePicker
                  :start="fStart"
                  :end="fEnd"
                  @apply="(s: string, e: string) => { fStart = s; fEnd = e; rangeOpen = false }"
                  @cancel="rangeOpen = false"
                  @clear="fStart = ''; fEnd = ''; rangeOpen = false"
                />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-3">
              <button
                v-for="p in ['hafta', 'oy', 'jami']"
                :key="p"
                @click="period = p as any"
                :class="['rounded-lg py-2 text-sm capitalize transition-colors', period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent']"
              >
                {{ p === 'hafta' ? 'Hafta' : p === 'oy' ? 'Oy' : 'Jami' }}
              </button>
            </div>
            <div class="text-xs text-muted-foreground mb-2">Kategoriya</div>
            <select v-model="fCategory" class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground mb-3">
              <option value="">Tanlash</option>
              <option v-for="c in data.categories" :key="c.category" :value="c.category">{{ c.category }}</option>
            </select>
            <button @click="applyFilter" class="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
              Qo'llash
            </button>
          </div>
        </div>
        <button
          @click="exportPdf"
          :disabled="exporting"
          class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-10 text-sm font-medium flex items-center gap-1.5 disabled:opacity-70"
        >
          <Download class="h-4 w-4" /> {{ exporting ? 'Tayyorlanmoqda...' : 'Yuklash' }}
        </button>
      </template>
    </PageHeader>

    <!-- Top stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Bugun ilovaga kirgan</div>
        <div class="text-2xl font-bold text-foreground">{{ data.top.today_active }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Jami a'zolar</div>
        <div class="text-2xl font-bold text-foreground">{{ data.top.total_members }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">A'zolikni yangilamadi</div>
        <div class="text-2xl font-bold text-foreground">{{ data.top.churn_rate }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Keyingi 7 kunda muddati tugaydi</div>
        <div class="text-2xl font-bold text-foreground">{{ data.top.expiring_week }}</div>
      </div>
    </div>

    <!-- Activity + Funnel row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-card border border-border p-5">
        <h3 class="text-foreground font-semibold">Kunlik va oylik faollik</h3>
        <p class="text-xs text-muted-foreground mb-4">Har kuni va har oy ilovaga kirgan a'zolar soni</p>
        <div class="h-64"><Bar :data="activityData" :options="activityOptions" /></div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-5">
        <h3 class="text-foreground font-semibold">Yuklab olishdan to'lashgacha</h3>
        <p class="text-xs text-muted-foreground mb-4">Har bosqichda qancha odam qoldi — qayerda ko'p tushayapti</p>
        <div class="space-y-4">
          <div v-for="f in data.funnel" :key="f.label">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="text-foreground">{{ f.label }}</span>
              <span class="text-muted-foreground">{{ f.value.toLocaleString() }} <span class="text-foreground ml-1">{{ f.pct }}</span></span>
            </div>
            <div class="h-6 rounded-lg bg-muted overflow-hidden">
              <div class="h-full rounded-lg bg-primary flex items-center justify-end pr-2" :style="{ width: f.pct }">
                <span class="text-[10px] font-medium text-primary-foreground">{{ f.value.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Most visited categories + Churn row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-card border border-border p-5">
        <h3 class="text-foreground font-semibold">Eng ko'p borilgan joylar</h3>
        <p class="text-xs text-muted-foreground mb-4">So'nggi 30 kunda QR skanerlangan tashriflar soni — kategoriya bo'yicha</p>
        <div class="space-y-2.5">
          <div
            v-for="(c, i) in data.categories"
            :key="c.category"
            class="relative"
            @mouseenter="hoveredCat = i"
            @mouseleave="hoveredCat = null"
          >
            <div class="flex items-center gap-3">
              <span class="w-16 text-xs text-muted-foreground shrink-0">{{ c.category }}</span>
              <div class="flex-1 h-5 rounded-md bg-muted overflow-hidden">
                <div class="h-full rounded-md bg-primary/80" :style="{ width: (c.visits / maxCatVisits * 100) + '%' }" />
              </div>
              <span class="text-xs text-foreground w-12 text-right shrink-0">{{ c.visits.toLocaleString() }}</span>
            </div>
            <div
              v-if="hoveredCat === i"
              class="absolute left-20 -top-1 z-10 rounded-lg bg-popover border border-border px-3 py-2 shadow-lg text-xs"
            >
              <div class="text-foreground font-medium mb-1">{{ c.category }}</div>
              <div class="text-muted-foreground">Tashriflar soni: <span class="text-foreground">{{ c.visits.toLocaleString() }}</span></div>
              <div class="text-muted-foreground">Hamkor bizneslar soni: <span class="text-foreground">{{ c.businesses }}</span></div>
              <div class="text-muted-foreground">Tejangan summa: <span class="text-foreground">{{ fmtBig(c.saved) }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-5">
        <h3 class="text-foreground font-semibold">A'zolikdan chiqib ketganlar</h3>
        <div class="text-3xl font-bold text-destructive my-2">{{ data.churn.rate }}</div>
        <div class="space-y-3 mt-4">
          <div v-for="r in data.churn.reasons" :key="r.reason">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-foreground">{{ r.reason }}</span>
              <span class="text-muted-foreground">{{ r.pct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full bg-destructive/80" :style="{ width: r.pct + '%' }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Savings section -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold">Chegirmalar orqali tejangan jami pul</h3>
      <p class="text-xs text-muted-foreground mb-3">Platforma ishga tushgandan beri barcha a'zolar birgalikda qancha tejadi</p>
      <div class="text-4xl font-bold text-primary mb-6">{{ fmtSom(data.savings.total) }}</div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="rounded-xl bg-muted/40 p-3">
          <div class="text-xs text-muted-foreground mb-1">Bu oyda tejashdi</div>
          <div class="text-lg font-bold text-foreground">{{ fmtSom(data.savings.this_month) }}</div>
        </div>
        <div class="rounded-xl bg-muted/40 p-3">
          <div class="text-xs text-muted-foreground mb-1">Eng ko'p tejagan a'zo</div>
          <div class="text-lg font-bold text-foreground">{{ fmtSom(data.savings.top_member.amount) }}</div>
          <div class="text-[11px] text-muted-foreground">{{ data.savings.top_member.name }}</div>
        </div>
        <div class="rounded-xl bg-muted/40 p-3">
          <div class="text-xs text-muted-foreground mb-1">Minimum tejalgan</div>
          <div class="text-lg font-bold text-foreground">{{ fmtSom(data.savings.min_saved) }}</div>
        </div>
        <div class="rounded-xl bg-muted/40 p-3">
          <div class="text-xs text-muted-foreground mb-1">Maximum tejalgan</div>
          <div class="text-lg font-bold text-foreground">{{ fmtSom(data.savings.max_saved) }}</div>
        </div>
      </div>

      <div class="space-y-2.5">
        <div v-for="c in data.savings.by_category" :key="c.category" class="flex items-center gap-3">
          <span class="w-16 text-xs text-muted-foreground shrink-0">{{ c.category }}</span>
          <div class="flex-1 h-5 rounded-md bg-muted overflow-hidden">
            <div class="h-full rounded-md bg-primary" :style="{ width: (c.saved / maxSaving * 100) + '%' }" />
          </div>
          <span class="text-xs text-foreground w-20 text-right shrink-0">{{ fmtBig(c.saved) }}</span>
        </div>
      </div>
    </div>

    <!-- Insight cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-2xl bg-card border border-border p-5">
        <Clock class="h-5 w-5 text-primary mb-2" />
        <div class="text-2xl font-bold text-foreground">{{ data.insights.peak_hour }}</div>
        <div class="text-xs text-muted-foreground mt-1">Kechki soatlarda a'zolar faolroq</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-5">
        <TrendingUp class="h-5 w-5 text-primary mb-2" />
        <div class="text-2xl font-bold text-foreground">{{ data.insights.top_category }}</div>
        <div class="text-xs text-muted-foreground mt-1">Bu oy {{ data.insights.top_category_visits }} marta borildi</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-5">
        <MapPin class="h-5 w-5 text-primary mb-2" />
        <div class="text-2xl font-bold text-foreground">{{ data.insights.top_city }}</div>
        <div class="text-xs text-muted-foreground mt-1">{{ data.insights.top_city_members }} faol a'zo shu yerda</div>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
</template>
