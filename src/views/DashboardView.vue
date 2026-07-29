<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import { Users, Building2, Coins, ChartNoAxesCombined, UserCheck, Bell, Calendar } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import api from '@/api/client'
import { PRIMARY, axisTicks, gridLines, baseTooltip } from '@/lib/chartTheme'

const router = useRouter()
const loading = ref(true)
const kpis = ref({
  active_users: '—',
  active_businesses: '—',
  monthly_revenue: '—',
  subscription_rate: '—',
  downloads: '—',
})

interface WeeklyPoint {
  day: string
  date: string
  value: number
  total_visits: number
  new_members: number
  active_members: number
}
interface MonthlyPoint {
  month: string
  year: number
  value: number
  payment_count: number
  growth_pct: string
}

const weekly = ref<WeeklyPoint[]>([])
const monthly = ref<MonthlyPoint[]>([])
const recentMembers = ref<any[]>([])
const pendingApplications = ref<any[]>([])

// ---- Date range filter ------------------------------------------------
const rangeStart = ref('')
const rangeEnd = ref('')
const showRangePicker = ref(false)

function formatDisplayDate(iso: string) {
  if (!iso) return 'kk.oo.yyyy'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
const rangeLabel = computed(
  () => `${formatDisplayDate(rangeStart.value)} – ${formatDisplayDate(rangeEnd.value)}`,
)

function applyRange() {
  showRangePicker.value = false
  load()
}
function onRangeApply(s: string, e: string) {
  rangeStart.value = s
  rangeEnd.value = e
  applyRange()
}
function clearRange() {
  rangeStart.value = ''
  rangeEnd.value = ''
  showRangePicker.value = false
  load()
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (rangeStart.value && rangeEnd.value) {
      params.start = rangeStart.value
      params.end = rangeEnd.value
    }
    const { data } = await api.get('/dashboard/', { params })
    kpis.value = data.kpis
    weekly.value = data.weekly
    monthly.value = data.monthly
    recentMembers.value = data.recent_members
    pendingApplications.value = data.pending_applications
  } finally {
    loading.value = false
  }
}

// ---- Notification bell (landing-site business applications) ----------
const alerts = ref<any[]>([])
const unreadCount = ref(0)
const showAlerts = ref(false)

async function loadAlerts() {
  try {
    const { data } = await api.get('/alerts/')
    alerts.value = data.results
    unreadCount.value = data.unread_count
  } catch {
    // silently ignore — bell stays empty if alerts aren't reachable
  }
}

async function toggleAlerts() {
  showAlerts.value = !showAlerts.value
  if (showAlerts.value && unreadCount.value > 0) {
    await api.post('/alerts/read-all/')
    unreadCount.value = 0
  }
}

function goToAlert(alert: any) {
  showAlerts.value = false
  // Biznesga bog'langan bildirishnoma (masalan chegirma foizini o'zgartirish
  // so'rovi) bosilganda o'sha biznesning detail sahifasi ochiladi.
  if (alert.member_id) {
    // Yangi a'zo haqidagi bildirishnoma -> o'sha foydalanuvchi sahifasi
    router.push(`/users/${alert.member_id}`)
  } else if (alert.business_id) {
    router.push(`/businesses/${alert.business_id}`)
  } else if (alert.kind === 'business_application') {
    // Landing arizasi haqidagi bildirishnoma -> Arizalar bo'limi
    router.push('/businesses/applications')
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('[data-alerts-root]')) showAlerts.value = false
  if (!target.closest('[data-range-root]')) showRangePicker.value = false
}

onMounted(() => {
  load()
  loadAlerts()
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

const WEEKDAY_FULL: Record<string, string> = {
  Du: 'Dushanba',
  Se: 'Seshanba',
  Ch: 'Chorshanba',
  Pa: 'Payshanba',
  Ju: 'Juma',
  Sh: 'Shanba',
  Ya: 'Yakshanba',
}

const weeklyData = computed(() => ({
  labels: weekly.value.map((d) => d.day),
  datasets: [
    {
      data: weekly.value.map((d) => d.value),
      backgroundColor: PRIMARY,
      borderRadius: 6,
      maxBarThickness: 36,
    },
  ],
}))

const monthlyData = computed(() => ({
  labels: monthly.value.map((d) => d.month),
  datasets: [
    {
      data: monthly.value.map((d) => d.value),
      borderColor: PRIMARY,
      backgroundColor: PRIMARY,
      pointBackgroundColor: PRIMARY,
      pointRadius: 4,
      tension: 0.35,
      fill: false,
    },
  ],
}))

function fmtNum(v: number) {
  return v.toLocaleString('uz-UZ').replace(/,/g, ' ')
}

const weeklyOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...baseTooltip,
      callbacks: {
        title: (items: any[]) => {
          const point = weekly.value[items[0].dataIndex]
          return point ? WEEKDAY_FULL[point.day] ?? point.day : ''
        },
        label: (ctx: any) => {
          const point = weekly.value[ctx.dataIndex]
          if (!point) return ''
          return [
            `Jami tashrif: ${fmtNum(point.total_visits)}`,
            `Yangi a'zolar: +${fmtNum(point.new_members)}`,
            `Faol a'zolar: ${fmtNum(point.active_members)}`,
          ]
        },
      },
    },
  },
  scales: {
    x: { grid: gridLines(false), ticks: axisTicks() },
    y: { grid: gridLines(true), ticks: axisTicks() },
  },
}))

function formatCompact(v: number) {
  return v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`
}

const monthlyOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...baseTooltip,
      callbacks: {
        title: (items: any[]) => {
          const point = monthly.value[items[0].dataIndex]
          return point ? `${point.month} ${point.year}` : ''
        },
        label: (ctx: any) => {
          const point = monthly.value[ctx.dataIndex]
          if (!point) return ''
          return [
            `Daromad: ${(point.value / 1_000_000).toFixed(0)} MLN so'm`,
            `To'lov soni: ${fmtNum(point.payment_count)}`,
            `O'tgan oyga: ${point.growth_pct}`,
          ]
        },
      },
    },
  },
  scales: {
    x: { grid: gridLines(false), ticks: axisTicks() },
    y: { grid: gridLines(true), ticks: { ...axisTicks(), callback: (v: any) => formatCompact(v) } },
  },
}))
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="Bosh sahifa" subtitle="Savin boshqaruv paneli">
      <template #actions>
        <div class="relative" data-range-root>
          <button
            @click="showRangePicker = !showRangePicker"
            class="hidden md:flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Calendar class="h-4 w-4" />
            <span>{{ rangeLabel }}</span>
          </button>
          <div v-if="showRangePicker" class="absolute right-0 mt-2 z-20">
            <DateRangePicker
              :start="rangeStart"
              :end="rangeEnd"
              @apply="onRangeApply"
              @cancel="showRangePicker = false"
              @clear="clearRange"
            />
          </div>
        </div>

        <div class="relative" data-alerts-root>
          <button
            @click="toggleAlerts"
            class="relative rounded-full bg-card border border-border h-10 w-10 flex items-center justify-center text-foreground hover:bg-muted"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] leading-4 text-white text-center"
            >
              {{ unreadCount }}
            </span>
          </button>
          <div
            v-if="showAlerts"
            class="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-xl z-20 max-h-96 overflow-y-auto"
          >
            <div class="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
              Bildirishnomalar
            </div>
            <div v-if="!alerts.length" class="px-4 py-6 text-sm text-muted-foreground text-center">
              Bildirishnomalar yo'q
            </div>
            <button
              v-for="a in alerts"
              :key="a.id"
              @click="goToAlert(a)"
              class="w-full text-left px-4 py-3 border-b border-border/60 last:border-0 hover:bg-muted transition-colors"
            >
              <div class="text-sm text-foreground font-medium">{{ a.title }}</div>
              <div v-if="a.body" class="text-xs text-muted-foreground mt-0.5">{{ a.body }}</div>
              <div class="text-[11px] text-muted-foreground mt-1">{{ a.time_ago }}</div>
            </button>
          </div>
        </div>
      </template>
    </PageHeader>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard :icon="Users" label="Faol foydalanuvchilar" :value="String(kpis.active_users)" to="/users" />
      <StatCard :icon="Building2" label="Faol bizneslar" :value="String(kpis.active_businesses)" to="/businesses" />
      <StatCard :icon="Coins" label="Oylik daromad" :value="String(kpis.monthly_revenue)" to="/payments" />
      <StatCard :icon="ChartNoAxesCombined" label="Obuna to'lash foizi" :value="String(kpis.subscription_rate)" to="/analytics" />
      <StatCard :icon="UserCheck" label="Yuklab olinganlar" :value="String(kpis.downloads)" to="/analytics" />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-card border border-border p-5">
        <div class="mb-4">
          <h3 class="text-foreground font-semibold">Haftalik foydalanuvchilar</h3>
          <p class="text-xs text-muted-foreground mt-0.5">Yangi va faol a'zolar</p>
        </div>
        <div class="h-64">
          <Bar v-if="weekly.length" :data="weeklyData" :options="weeklyOptions" />
        </div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-5">
        <div class="mb-4">
          <h3 class="text-foreground font-semibold">Oylik daromad</h3>
        </div>
        <div class="h-64">
          <Line v-if="monthly.length" :data="monthlyData" :options="monthlyOptions" />
        </div>
      </div>
    </div>

    <!-- Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Recent members -->
      <div class="rounded-2xl bg-card border border-border p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-foreground font-semibold">So'nggi a'zolar</h3>
          <RouterLink to="/users" class="rounded-full bg-muted hover:bg-accent text-xs px-3 py-1.5 text-foreground transition-colors">
            Barchasini ko'rish ›
          </RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-muted-foreground text-xs">
                <th class="text-left font-normal py-2">Ism</th>
                <th class="text-left font-normal py-2">Telefon</th>
                <th class="text-left font-normal py-2">Status</th>
                <th class="text-left font-normal py-2">A'zo bo'lgan</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in recentMembers"
                :key="r.id"
                @click="router.push(`/users/${r.id}`)"
                class="border-t border-border/60 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <td class="py-3 text-foreground">{{ r.name }}</td>
                <td class="py-3 text-muted-foreground">{{ r.phone }}</td>
                <td class="py-3"><StatusBadge :status="r.is_blocked ? 'Bloklangan' : r.status" /></td>
                <td class="py-3 text-muted-foreground">{{ r.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pending business applications -->
      <div class="rounded-2xl bg-card border border-border p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-foreground font-semibold">Kutilayotgan Biznes Arizalar</h3>
          <RouterLink to="/businesses/applications" class="rounded-full bg-muted hover:bg-accent text-xs px-3 py-1.5 text-foreground transition-colors">
            Barchasini ko'rish ›
          </RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-muted-foreground text-xs">
                <th class="text-left font-normal py-2">Biznes nomi</th>
                <th class="text-left font-normal py-2">Kategoriya</th>
                <th class="text-left font-normal py-2">Status</th>
                <th class="text-left font-normal py-2">Sana</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="a in pendingApplications"
                :key="a.id"
                @click="router.push('/businesses/applications')"
                class="border-t border-border/60 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <td class="py-3 text-foreground">{{ a.business_name }}</td>
                <td class="py-3 text-muted-foreground">{{ a.category }}</td>
                <td class="py-3"><StatusBadge :status="a.status" /></td>
                <td class="py-3 text-muted-foreground text-xs">{{ a.when }}</td>
              </tr>
              <tr v-if="!pendingApplications.length">
                <td colspan="4" class="py-8 text-center text-muted-foreground text-sm">Arizalar yo'q</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
