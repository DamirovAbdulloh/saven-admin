<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Download, ChevronRight, Plus, ChevronDown } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import BusinessWizard from '@/components/BusinessWizard.vue'
import api from '@/api/client'
import { downloadTablePdf } from '@/lib/pdf'
import { toast } from '@/composables/useToast'

const router = useRouter()

const CATEGORIES = ['Restoran', 'Kafe', 'Fitness', 'Barber', 'Salon', 'Avto', 'Tibbiyot', 'Shifoxona', "Ta'lim", 'Taxi']
const STATUS_OPTIONS = ['Tasdiqlangan', 'Kutilmoqda', 'Takroriy', 'Rad etilgan', 'Bloklangan']
const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon',
  'Buxoro',
  "Farg'ona",
  'Jizzax',
  'Namangan',
  'Navoiy',
  'Qashqadaryo',
  "Qoraqalpog'iston",
  'Samarqand',
  'Sirdaryo',
  'Surxondaryo',
  'Xorazm',
]

const stats = ref({ total: 0, approved: 0, pending: 0, blocked: 0 })
const rows = ref<any[]>([])
const loading = ref(true)
const count = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = ref('')
let searchTimer: number | undefined

const wizardOpen = ref(false)

// Filter state
const filterOpen = ref(false)
const catDropdownOpen = ref(false)
const fCategories = ref<string[]>([])
const fStatus = ref<string | null>(null)
const fRegion = ref<string | null>(null)
const fDiscountMin = ref<string>('')
const fDiscountMax = ref<string>('')
const filterActive = ref(false)

async function loadStats() {
  const { data } = await api.get('/businesses/stats/')
  stats.value = data
}
async function loadRows() {
  loading.value = true
  try {
    const params: Record<string, any> = { search: search.value, page: page.value }
    if (filterActive.value) {
      if (fCategories.value.length) params.categories = fCategories.value.join(',')
      if (fStatus.value) params.status = fStatus.value
      if (fRegion.value) params.region = fRegion.value
      if (fDiscountMin.value !== '') params.discount_min = fDiscountMin.value
      if (fDiscountMax.value !== '') params.discount_max = fDiscountMax.value
    }
    const { data } = await api.get('/businesses/', { params })
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

function toggleCategory(c: string) {
  const idx = fCategories.value.indexOf(c)
  if (idx === -1) fCategories.value.push(c)
  else fCategories.value.splice(idx, 1)
}
function applyFilter() {
  filterActive.value = true
  filterOpen.value = false
  page.value = 1
  loadRows()
}
function clearFilter() {
  fCategories.value = []
  fStatus.value = null
  fRegion.value = null
  fDiscountMin.value = ''
  fDiscountMax.value = ''
  filterActive.value = false
  filterOpen.value = false
  page.value = 1
  loadRows()
}
const exporting = ref(false)
async function exportPdf() {
  exporting.value = true
  try {
    const { data } = await api.get('/businesses/export/')
    await downloadTablePdf({ filename: 'bizneslar.pdf', ...data })
    toast.success('PDF yuklab olindi')
  } catch {
    toast.error('Yuklab olishda xatolik yuz berdi')
  } finally {
    exporting.value = false
  }
}
function openDetail(row: any) {
  router.push(`/businesses/${row.id}`)
}
function onCreated() {
  wizardOpen.value = false
  loadStats()
  loadRows()
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="Bizneslar" subtitle="Hamkor bizneslarni boshqarish va arizalarni ko'rib chiqish">
      <template #actions>
        <RouterLink
          to="/businesses/applications"
          class="rounded-xl bg-muted hover:bg-accent px-4 h-10 text-sm font-medium text-foreground flex items-center transition-colors"
        >
          Arizalar
        </RouterLink>
        <button
          @click="wizardOpen = true"
          class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-10 text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus class="h-4 w-4" /> Biznes qo'shish
        </button>
      </template>
    </PageHeader>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Jami bizneslar" :value="stats.total.toLocaleString()" />
      <StatCard label="Faol hamkorlar" :value="stats.approved.toLocaleString()" variant="premium" />
      <StatCard label="Kutilayotgan" :value="stats.pending.toLocaleString()" variant="pending" />
      <StatCard label="Bloklangan" :value="stats.blocked.toLocaleString()" variant="overdue" />
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

              <!-- Category multi-select -->
              <div class="text-xs text-muted-foreground mb-2">Kategoriya</div>
              <div class="relative mb-3">
                <button
                  @click="catDropdownOpen = !catDropdownOpen"
                  class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground flex items-center justify-between"
                >
                  <span class="truncate">{{ fCategories.length ? fCategories.join(', ') : 'Tanlang' }}</span>
                  <ChevronDown class="h-4 w-4 text-muted-foreground" />
                </button>
                <div
                  v-if="catDropdownOpen"
                  class="absolute left-0 right-0 mt-1 max-h-44 overflow-y-auto rounded-lg bg-popover border border-border shadow-lg z-10 p-1"
                >
                  <label
                    v-for="c in CATEGORIES"
                    :key="c"
                    class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :checked="fCategories.includes(c)"
                      @change="toggleCategory(c)"
                      class="accent-primary"
                    />
                    {{ c }}
                  </label>
                </div>
              </div>

              <!-- Status -->
              <div class="text-xs text-muted-foreground mb-2">Ariza holati</div>
              <div class="space-y-1 mb-3">
                <label
                  v-for="s in STATUS_OPTIONS"
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

              <!-- Region -->
              <div class="text-xs text-muted-foreground mb-2">Viloyat/Shahar</div>
              <select
                v-model="fRegion"
                class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground mb-3"
              >
                <option :value="null">Tanlang</option>
                <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
              </select>

              <!-- Discount range (manual input) -->
              <div class="text-xs text-muted-foreground mb-2">Chegirma foizi</div>
              <div class="flex items-center gap-2 mb-4">
                <div class="relative flex-1">
                  <input
                    v-model="fDiscountMin"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    class="w-full h-9 rounded-lg bg-muted border border-border pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                <span class="text-xs text-muted-foreground">—</span>
                <div class="relative flex-1">
                  <input
                    v-model="fDiscountMax"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    class="w-full h-9 rounded-lg bg-muted border border-border pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
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

      <div v-if="rows.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground text-xs bg-muted/50">
              <th class="text-left font-normal py-2.5 px-3 rounded-l-lg">#</th>
              <th class="text-left font-normal py-2.5 px-3">ID</th>
              <th class="text-left font-normal py-2.5 px-3">Biznes nomi</th>
              <th class="text-left font-normal py-2.5 px-3">Kategoriya</th>
              <th class="text-left font-normal py-2.5 px-3">Chegirma</th>
              <th class="text-left font-normal py-2.5 px-3">Telefon</th>
              <th class="text-left font-normal py-2.5 px-3">Manzil</th>
              <th class="text-left font-normal py-2.5 px-3">Holat</th>
              <th class="text-right font-normal py-2.5 px-3 rounded-r-lg">Profil</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in rows"
              :key="r.id"
              @click="openDetail(r)"
              class="border-t border-border/60 hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <td class="py-3 px-3 text-muted-foreground">{{ (page - 1) * pageSize + i + 1 }}</td>
              <td class="py-3 px-3 text-muted-foreground font-mono text-xs">{{ r.business_code }}</td>
              <td class="py-3 px-3 text-foreground font-medium">{{ r.name }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.category }}</td>
              <td class="py-3 px-3">
                <span class="inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium">
                  {{ r.discount_percent }}%
                </span>
              </td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.phone }}</td>
              <td class="py-3 px-3 text-muted-foreground">{{ r.region }}</td>
              <td class="py-3 px-3"><StatusBadge :status="r.status" /></td>
              <td class="py-3 px-3 text-right">
                <button class="rounded-lg h-8 w-8 inline-flex items-center justify-center bg-muted hover:bg-accent transition-colors">
                  <ChevronRight class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="py-24 text-center">
        <p class="text-foreground font-semibold text-lg mb-3">Hali hech qanday biznes yo'q</p>
        <button
          @click="wizardOpen = true"
          class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <Plus class="h-4 w-4" /> Biznes qo'shish
        </button>
      </div>
      <div v-else class="py-24 text-center text-muted-foreground text-sm">Yuklanmoqda...</div>

      <PaginationBar :count="count" :page="page" :page-size="pageSize" @update:page="page = $event" />
    </div>

    <BusinessWizard v-if="wizardOpen" @close="wizardOpen = false" @created="onCreated" />
  </div>
</template>
