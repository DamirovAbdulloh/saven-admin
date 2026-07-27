<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Check, X, AlertTriangle, Ban, Pencil, Download } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import AppModal from '@/components/AppModal.vue'
import BusinessEditDrawer from '@/components/BusinessEditDrawer.vue'
import LocationMap from '@/components/LocationMap.vue'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

const biz = ref<any>(null)
const loading = ref(true)
const tab = ref<'info' | 'discount' | 'requests' | 'documents' | 'transactions'>('info')

const transactions = ref<any[]>([])
const txFilterOpen = ref(false)
const txStatus = ref<string | null>(null)

// --- Biznes panelidan kelgan so'rovlar (masalan chegirma o'zgartirish) ---
const requests = ref<any[]>([])
const reqActing = ref(false)
const reqRejectOpen = ref(false)
const reqRejectReason = ref('')
const activeReq = ref<any>(null)

async function loadRequests() {
  const { data } = await api.get(`/businesses/${route.params.id}/requests/`)
  requests.value = data
}

async function approveRequest(r: any) {
  if (reqActing.value) return
  reqActing.value = true
  try {
    const { data } = await api.post(`/business-requests/${r.id}/approve/`)
    Object.assign(r, data)
    toast.success("So'rov tasdiqlandi — biznes egasiga bildirishnoma yuborildi")
    load() // biznes kartasidagi foiz ham yangilandi
  } catch (e: any) {
    toast.error(e?.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    reqActing.value = false
  }
}

function openRejectRequest(r: any) {
  activeReq.value = r
  reqRejectReason.value = ''
  reqRejectOpen.value = true
}

async function confirmRejectRequest() {
  if (!reqRejectReason.value.trim()) {
    toast.error('Rad etish sababini kiriting')
    return
  }
  if (reqActing.value) return
  reqActing.value = true
  try {
    const { data } = await api.post(
      `/business-requests/${activeReq.value.id}/reject/`,
      { reason: reqRejectReason.value },
    )
    Object.assign(activeReq.value, data)
    reqRejectOpen.value = false
    toast.error("So'rov rad etildi — sabab biznes egasiga yuborildi")
  } catch (e: any) {
    toast.error(e?.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    reqActing.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/businesses/${route.params.id}/`)
    biz.value = data
  } catch {
    toast.error("Ma'lumotni yuklab bo'lmadi")
    router.push('/businesses')
  } finally {
    loading.value = false
  }
}
async function loadTransactions() {
  const { data } = await api.get(`/businesses/${route.params.id}/transactions/`, {
    params: { status: txStatus.value ?? undefined },
  })
  transactions.value = data
}
onMounted(load)
watch(tab, (t) => {
  if (t === 'transactions') loadTransactions()
  if (t === 'requests') loadRequests()
})

const editOpen = ref(false)
const rejectOpen = ref(false)
const blockOpen = ref(false)
const rejectReason = ref('')
const blockReason = ref('')

async function approve() {
  try {
    const { data } = await api.post(`/businesses/${biz.value.id}/approve/`)
    biz.value = data
    toast.success('Tasdiqlandi')
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}
async function confirmReject() {
  if (!rejectReason.value.trim()) {
    toast.error('Rad etish sababini kiriting')
    return
  }
  try {
    const { data } = await api.post(`/businesses/${biz.value.id}/reject/`, { reason: rejectReason.value })
    biz.value = data
    rejectOpen.value = false
    toast.error('Rad etildi')
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}
async function confirmBlock() {
  try {
    const { data } = await api.post(`/businesses/${biz.value.id}/block/`, { reason: blockReason.value })
    biz.value = data
    blockOpen.value = false
    toast.success(data.status === 'Bloklangan' ? 'Bloklandi' : 'Blokdan chiqarildi')
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}
function onSaved(updated: any) {
  biz.value = updated
  editOpen.value = false
  toast.success('Saqlandi')
}

const tabs = [
  { key: 'info', label: "Ma'lumotlar" },
  { key: 'discount', label: 'Chegirmalar' },
  { key: 'requests', label: "So'rovlar" },
  { key: 'documents', label: 'Hujjatlar' },
  { key: 'transactions', label: "To'lovlar tarixi" },
] as const
</script>

<template>
  <div v-if="biz" class="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <RouterLink to="/businesses" class="hover:text-foreground">Bizneslar</RouterLink>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">{{ biz.name }}</span>
    </div>

    <!-- Top stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Jami foydalanuvchilar</div>
        <div class="text-2xl font-bold text-foreground">{{ biz.users_count.toLocaleString() }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Foydalanuvchilar to'lagan</div>
        <div class="text-2xl font-bold text-foreground">{{ biz.transactions_paid }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Chegirma foizi</div>
        <div class="text-2xl font-bold text-foreground">{{ biz.discount_percent }}%</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-1">Faol bo'lgan muddat</div>
        <div class="text-2xl font-bold text-foreground">{{ biz.active_days }} kun</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="tab = t.key"
        :class="[
          'rounded-xl px-4 py-2 text-sm transition-colors',
          tab === t.key ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-muted text-muted-foreground hover:bg-accent',
        ]"
      >
        {{ t.label }}
      </button>
      <div class="ml-auto"><StatusBadge :status="biz.status" /></div>
    </div>

    <!-- Info tab -->
    <div v-if="tab === 'info'" class="rounded-2xl bg-card border border-border p-6 space-y-8">
      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Biznes ma'lumotlari</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div><div class="text-xs text-muted-foreground">Biznes nomi</div><div class="text-foreground mt-0.5">{{ biz.name }}</div></div>
          <div><div class="text-xs text-muted-foreground">Kategoriya</div><div class="text-foreground mt-0.5">{{ biz.category }}</div></div>
          <div><div class="text-xs text-muted-foreground">Biznes turi</div><div class="text-foreground mt-0.5">{{ biz.business_type }}</div></div>
          <div><div class="text-xs text-muted-foreground">STIR / Soliq raqami</div><div class="text-foreground mt-0.5">{{ biz.stir }}</div></div>
          <div><div class="text-xs text-muted-foreground">Mas'ul shaxs</div><div class="text-foreground mt-0.5">{{ biz.owner }}</div></div>
        </div>
      </section>

      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Kontakt</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div><div class="text-xs text-muted-foreground">Telefon</div><div class="text-foreground mt-0.5">{{ biz.phone }}</div></div>
          <div><div class="text-xs text-muted-foreground">Email</div><div class="text-foreground mt-0.5">{{ biz.email }}</div></div>
          <div><div class="text-xs text-muted-foreground">Ish vaqti</div><div class="text-foreground mt-0.5">{{ biz.work_hours }}, {{ biz.work_days }}</div></div>
          <div><div class="text-xs text-muted-foreground">Instagram</div><div class="text-foreground mt-0.5">{{ biz.instagram }}</div></div>
        </div>
      </section>

      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Manzil</h3>
        <div class="grid grid-cols-2 gap-y-4 mb-4">
          <div><div class="text-xs text-muted-foreground">Viloyat</div><div class="text-foreground mt-0.5">{{ biz.region }}</div></div>
          <div><div class="text-xs text-muted-foreground">Shahar / Tuman</div><div class="text-foreground mt-0.5">{{ biz.district }}</div></div>
        </div>
        <div class="text-xs text-muted-foreground">To'liq manzil</div>
        <div class="text-foreground mt-0.5 mb-4">{{ biz.address }}</div>
        <!-- Biznes egasi arizada xaritada belgilagan lokatsiya -->
        <LocationMap :latitude="biz.latitude" :longitude="biz.longitude" :label="biz.name" />
      </section>

      <section v-if="biz.reject_reason || biz.block_reason" class="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
        <div class="text-xs text-destructive font-medium">{{ biz.status === 'Bloklangan' ? 'Bloklash sababi' : 'Rad etish sababi' }}</div>
        <div class="text-sm text-foreground mt-1">{{ biz.block_reason || biz.reject_reason }}</div>
      </section>

      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Kirish ma'lumotlari</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div><div class="text-xs text-muted-foreground">Login</div><div class="text-foreground mt-0.5">{{ biz.login }}</div></div>
          <div><div class="text-xs text-muted-foreground">Parol</div><div class="text-foreground mt-0.5">{{ biz.password }}</div></div>
        </div>
      </section>
    </div>

    <!-- Discount tab -->
    <div v-if="tab === 'discount'" class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Xizmat turlari bo'yicha chegirma foizlari</h3>
      <div class="rounded-xl bg-muted/40 border border-border p-4 flex items-center justify-between">
        <div>
          <div class="text-foreground font-medium">{{ biz.discount_scope }}</div>
          <div class="text-xs text-muted-foreground mt-0.5">Standart chegirma · Min. xarid: {{ biz.min_purchase_fmt }}</div>
        </div>
        <span class="inline-flex items-center rounded-full bg-primary/15 text-primary px-3 py-1 text-sm font-semibold">{{ biz.discount_percent }}%</span>
      </div>
    </div>

    <!-- So'rovlar tab: biznes panelidan kelgan so'rovlar -->
    <div v-if="tab === 'requests'" class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Biznes egasi yuborgan so'rovlar</h3>
      <div class="space-y-4">
        <div
          v-for="r in requests"
          :key="r.id"
          class="rounded-xl bg-muted/40 border border-border p-4"
        >
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div class="text-foreground font-medium text-sm">{{ r.title }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ r.body }}</div>
              <div v-if="r.reason" class="text-xs text-muted-foreground mt-1">
                Biznes egasining sababi: {{ r.reason }}
              </div>
              <div class="text-[11px] text-muted-foreground mt-1.5">{{ r.when }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-semibold">
                {{ r.old_percent }}% → {{ r.new_percent }}%
              </span>
              <StatusBadge :status="r.status" />
            </div>
          </div>

          <div v-if="r.reject_reason" class="mt-3 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
            <div class="text-[11px] text-destructive font-medium">Rad etish sababi</div>
            <div class="text-xs text-foreground mt-0.5">{{ r.reject_reason }}</div>
          </div>

          <!-- Kutilmoqda bo'lsa: Rad etish / Tasdiqlash -->
          <div v-if="r.status === 'Kutilmoqda'" class="mt-4 flex items-center gap-2">
            <button
              @click="openRejectRequest(r)"
              :disabled="reqActing"
              class="rounded-xl bg-muted hover:bg-accent px-4 py-2 text-sm font-medium text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <X class="h-4 w-4" /> Rad etish
            </button>
            <button
              @click="approveRequest(r)"
              :disabled="reqActing"
              class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <Check class="h-4 w-4" /> Tasdiqlash
            </button>
          </div>
        </div>
        <p v-if="!requests.length" class="text-sm text-muted-foreground text-center py-6">
          Hozircha so'rovlar yo'q
        </p>
      </div>
    </div>

    <!-- Documents tab -->
    <div v-if="tab === 'documents'" class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Yuklangan hujjatlar</h3>
      <div v-if="biz.document_name" class="text-xs text-muted-foreground mb-2">Shartnoma</div>
      <div v-if="biz.document_name" class="rounded-xl bg-muted/40 border border-border p-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center text-destructive text-xs font-bold">PDF</div>
          <div>
            <div class="text-sm text-foreground">{{ biz.document_name }}</div>
            <div class="text-xs text-muted-foreground">{{ biz.document_size_kb }} KB</div>
          </div>
        </div>
        <button class="text-muted-foreground hover:text-foreground"><Download class="h-4 w-4" /></button>
      </div>
      <p v-else class="text-sm text-muted-foreground">Hujjat yuklanmagan</p>
    </div>

    <!-- Transactions tab -->
    <div v-if="tab === 'transactions'" class="rounded-2xl bg-card border border-border p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-foreground font-semibold text-lg">Tranzaksiyalar ro'yxati</h3>
        <div class="relative">
          <button
            @click="txFilterOpen = !txFilterOpen"
            class="rounded-xl bg-muted hover:bg-accent px-4 h-9 text-sm flex items-center gap-1.5 text-foreground"
          >
            Filtr
          </button>
          <div v-if="txFilterOpen" class="absolute right-0 mt-2 w-52 rounded-xl bg-popover border border-border shadow-lg z-10 p-3">
            <div class="text-xs text-muted-foreground mb-2">Ariza holati</div>
            <label
              v-for="s in ['Barchasi', 'Muvaffaqiyatli', 'Bekor qilingan']"
              :key="s"
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer"
            >
              <input
                type="radio"
                :checked="(s === 'Barchasi' && !txStatus) || txStatus === s"
                @change="txStatus = s === 'Barchasi' ? null : s"
                class="accent-[oklch(0.848_0.201_137)]"
              />
              {{ s }}
            </label>
            <button
              @click="loadTransactions(); txFilterOpen = false"
              class="w-full mt-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Qo'llash
            </button>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <div
          v-for="t in transactions"
          :key="t.id"
          class="flex items-center justify-between border-b border-border/50 pb-3 last:border-0"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="text-foreground font-medium text-sm">{{ t.member_name }}</span>
              <StatusBadge :status="t.status" />
            </div>
            <div class="text-xs text-muted-foreground mt-0.5">Kassir: {{ t.cashier }}</div>
          </div>
          <div class="text-right">
            <div class="text-foreground font-medium text-sm">{{ t.final }}</div>
            <div class="text-xs text-muted-foreground line-through">{{ t.original }}</div>
            <div class="text-[11px] text-muted-foreground">{{ t.when }}</div>
          </div>
        </div>
        <p v-if="!transactions.length" class="text-sm text-muted-foreground text-center py-6">Tranzaksiyalar yo'q</p>
      </div>
    </div>

    <!-- Action bar -->
    <div class="flex flex-wrap items-center justify-center gap-3 pt-2 pb-4">
      <template v-if="biz.status === 'Kutilmoqda' || biz.status === 'Takroriy'">
        <button
          @click="rejectOpen = true"
          class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-2 transition-colors"
        >
          <X class="h-4 w-4" /> Rad etish
        </button>
        <button
          @click="approve"
          class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Check class="h-4 w-4" /> Tasdiqlash
        </button>
      </template>
      <template v-else>
        <button
          @click="blockOpen = true"
          class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-2 transition-colors"
        >
          <Ban class="h-4 w-4" /> {{ biz.status === 'Bloklangan' ? 'Blokdan chiqarish' : 'Bloklash' }}
        </button>
        <button
          @click="editOpen = true"
          class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Pencil class="h-4 w-4" /> Tahrirlash
        </button>
      </template>
    </div>

    <!-- Reject modal -->
    <AppModal
      v-if="rejectOpen"
      tone="red"
      title="Arizani rad etish"
      subtitle="Biznesga rad etish sababi yuboriladi."
      @close="rejectOpen = false"
    >
      <template #icon><AlertTriangle class="h-6 w-6 text-white" /></template>
      <div class="text-xs text-muted-foreground mb-2">Rad etish sababi <span class="text-destructive">*</span></div>
      <textarea
        v-model="rejectReason"
        placeholder="Hujjatlar to'liq emas, qayta yuborish talab etiladi..."
        class="w-full min-h-24 rounded-xl bg-muted border border-border p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <template #actions>
        <button @click="rejectOpen = false" class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors">
          Bekor qilish
        </button>
        <button @click="confirmReject" class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors">
          Rad etish
        </button>
      </template>
    </AppModal>

    <!-- Block modal -->
    <AppModal
      v-if="blockOpen"
      tone="red"
      :title="biz.status === 'Bloklangan' ? 'Blokdan chiqarish' : 'Biznesni bloklash'"
      @close="blockOpen = false"
    >
      <template #icon><Ban class="h-6 w-6 text-white" /></template>
      <div v-if="biz.status !== 'Bloklangan'">
        <div class="text-xs text-muted-foreground mb-2">Bloklash sababi</div>
        <textarea
          v-model="blockReason"
          placeholder="Sababni yozing..."
          class="w-full min-h-20 rounded-xl bg-muted border border-border p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <p v-else class="text-sm text-muted-foreground text-center">Biznesni blokdan chiqarishni tasdiqlaysizmi?</p>
      <template #actions>
        <button @click="blockOpen = false" class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors">
          Bekor qilish
        </button>
        <button @click="confirmBlock" class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors">
          Tasdiqlash
        </button>
      </template>
    </AppModal>

    <!-- So'rovni rad etish modali -->
    <AppModal
      v-if="reqRejectOpen"
      tone="red"
      title="So'rov rad etilsinmi?"
      subtitle="Rad etish sababi biznes egasiga bildirishnoma sifatida yuboriladi."
      @close="reqRejectOpen = false"
    >
      <template #icon><AlertTriangle class="h-6 w-6 text-white" /></template>
      <div class="text-xs text-muted-foreground mb-2">Rad etish sababi <span class="text-destructive">*</span></div>
      <textarea
        v-model="reqRejectReason"
        placeholder="Masalan: hozirgi foiz kategoriya o'rtachasiga mos, o'zgartirish asoslanmagan..."
        class="w-full min-h-24 rounded-xl bg-muted border border-border p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <template #actions>
        <button @click="reqRejectOpen = false" class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors">
          Bekor qilish
        </button>
        <button @click="confirmRejectRequest" class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors">
          Rad etish
        </button>
      </template>
    </AppModal>

    <BusinessEditDrawer v-if="editOpen" :business="biz" @close="editOpen = false" @saved="onSaved" />
  </div>

  <div v-else-if="loading" class="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
</template>
