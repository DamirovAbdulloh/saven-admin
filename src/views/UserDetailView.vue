<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, AlertTriangle, Clock, Ban, CalendarClock, Bell, Check, X, Gift } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import AppModal from '@/components/AppModal.vue'
import RadioRow from '@/components/RadioRow.vue'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

const member = ref<any>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/users/${route.params.id}/`)
    member.value = data
    await loadReferralRequests()
  } catch {
    toast.error("Ma'lumotni yuklab bo'lmadi")
    router.push('/users')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ---- Referal so'rovlari (foydalanuvchi yuborgan) -------------------------
const referralRequests = ref<any[]>([])
const refBusy = ref(false)

async function loadReferralRequests() {
  try {
    const { data } = await api.get(`/users/${route.params.id}/referral-requests/`)
    referralRequests.value = data.results ?? data
  } catch {
    referralRequests.value = []
  }
}

async function approveRef(r: any) {
  if (refBusy.value) return
  refBusy.value = true
  try {
    await api.post(`/referral-requests/${r.id}/approve/`)
    toast.success("So'rov tasdiqlandi — a'zolik +1 oyga uzaytirildi")
    await load()
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    refBusy.value = false
  }
}

// Rad etish modali
const refRejectOpen = ref(false)
const refActiveReq = ref<any>(null)
const refRejectReason = ref('')

function openRejectRef(r: any) {
  refActiveReq.value = r
  refRejectReason.value = ''
  refRejectOpen.value = true
}

async function confirmRejectRef() {
  if (refBusy.value) return
  if (!refRejectReason.value.trim()) {
    toast.error('Rad etish sababini kiriting')
    return
  }
  refBusy.value = true
  try {
    await api.post(`/referral-requests/${refActiveReq.value.id}/reject/`, {
      reason: refRejectReason.value.trim(),
    })
    toast.success("So'rov rad etildi — sabab foydalanuvchiga yuborildi")
    refRejectOpen.value = false
    await loadReferralRequests()
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    refBusy.value = false
  }
}

// ---- Block modal ---------------------------------------------------------
const blockOpen = ref(false)
const blockReason = ref('Shubhali faollik')
const blockComment = ref('')
const blockReasons = ['Shubhali faollik', "To'lov muammosi", 'Foydalanuvchi so\'rovi', 'Boshqa sabab']
const blockBusy = ref(false)

async function confirmBlock() {
  blockBusy.value = true
  try {
    const { data } = await api.post(`/users/${member.value.id}/block/`, {
      blocked: true,
      reason: blockReason.value,
      comment: blockComment.value,
    })
    member.value = data
    blockOpen.value = false
    toast.error('Muvaffaqiyatli bloklandi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    blockBusy.value = false
  }
}

async function unblock() {
  try {
    const { data } = await api.post(`/users/${member.value.id}/block/`, { blocked: false })
    member.value = data
    toast.success('Blokdan chiqarildi')
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

// ---- Extend modal --------------------------------------------------------
const extendOpen = ref(false)
const extendMonths = ref(3)
const extendReason = ref("Referal mukofoti (3 do'st taklif qildi)")
const extendReasons = [
  "Referal mukofoti (3 do'st taklif qildi)",
  'Texnik muammo kompensatsiyasi',
  'Admin qarori',
]
const extendBusy = ref(false)
const monthPrices: Record<number, string> = { 1: "20,000 so'm", 3: "60,000 so'm", 6: "120,000 so'm" }

async function confirmExtend() {
  extendBusy.value = true
  try {
    const { data } = await api.post(`/users/${member.value.id}/extend/`, {
      months: extendMonths.value,
      reason: extendReason.value,
    })
    member.value = data
    extendOpen.value = false
    toast.success(`${extendMonths.value} oyga uzaytirildi`)
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    extendBusy.value = false
  }
}

function sendNotification() {
  router.push({ path: '/notifications', query: { member: member.value.id, name: member.value.name } })
}

const referralText = computed(() =>
  member.value ? `${member.value.referral_invited} / ${member.value.referral_target}` : '',
)
</script>

<template>
  <div v-if="member" class="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <RouterLink to="/users" class="hover:text-foreground">Foydalanuvchilar</RouterLink>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">{{ member.name }}</span>
    </div>

    <!-- Header -->
    <div class="rounded-2xl bg-card border border-border p-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">{{ member.name }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ member.phone }} · #{{ member.member_code }}</p>
        <p v-if="member.is_blocked" class="text-xs text-destructive mt-2">
          Bloklash sababi: {{ member.block_reason }} · {{ member.blocked_at_fmt }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="flex gap-2">
          <StatusBadge :status="member.status" />
          <StatusBadge :status="member.is_blocked ? 'Bloklangan' : member.activity_status" />
        </div>
        <span class="text-xs text-muted-foreground">Ro'yxatdan o'tgan: {{ member.date }}</span>
      </div>
    </div>

    <!-- Top stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-2">Jami tejagan</div>
        <div class="text-2xl font-bold text-foreground">{{ member.savings }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-2">Obunada</div>
        <div class="text-2xl font-bold text-foreground">{{ member.months_subscribed }} oy</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-2">Keyingi to'lov</div>
        <div class="text-2xl font-bold text-foreground">{{ member.next_payment ?? '— Obuna yo\'q' }}</div>
      </div>
      <div class="rounded-2xl bg-card border border-border p-4">
        <div class="text-xs text-muted-foreground mb-2">Referal</div>
        <div class="text-2xl font-bold text-foreground">{{ referralText }}</div>
      </div>
    </div>

    <!-- Subscription -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Obuna holati</h3>
      <div class="grid grid-cols-2 gap-y-4 mb-4">
        <div>
          <div class="text-xs text-muted-foreground">A'zolik turi</div>
          <div class="text-foreground mt-0.5">{{ member.status }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Holat</div>
          <div class="text-foreground mt-0.5">{{ member.is_blocked ? 'Bloklangan' : member.activity_status }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Boshlanish sanasi</div>
          <div class="text-foreground mt-0.5">{{ member.membership_start_fmt ?? '—' }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Tugash sanasi</div>
          <div class="text-foreground mt-0.5">{{ member.membership_end_fmt ?? '—' }}</div>
        </div>
      </div>

      <template v-if="member.progress_pct !== null">
        <div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{{ member.membership_start_fmt }}</span>
          <span class="text-foreground">{{ member.days_left }} kun qoldi</span>
          <span>{{ member.membership_end_fmt }}</span>
        </div>
        <div class="h-2 rounded-full bg-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-[#2e90fa]"
            :style="{ width: member.progress_pct + '%' }"
          />
        </div>
      </template>

      <p v-if="member.extend_months" class="text-xs text-muted-foreground mt-3">
        Uzaytirildi: {{ member.extended_at_fmt }} · Sabab: {{ member.extend_reason }} · +{{ member.extend_months }} oy qo'shildi
      </p>
    </div>

    <!-- Personal info -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Shaxsiy ma'lumotlar</h3>
      <div class="grid grid-cols-2 gap-y-4">
        <div>
          <div class="text-xs text-muted-foreground">Ism-Familiya</div>
          <div class="text-foreground mt-0.5">{{ member.name }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Telefon</div>
          <div class="text-foreground mt-0.5">{{ member.phone }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Qurilma</div>
          <div class="text-foreground mt-0.5">{{ member.device || '—' }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Push bildirishnoma</div>
          <div class="text-foreground mt-0.5">{{ member.push_enabled ? 'Yoqilgan' : "O'chirilgan" }}</div>
        </div>
      </div>
    </div>

    <!-- Referral -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Referal holati</h3>
      <div class="grid grid-cols-2 gap-y-4">
        <div>
          <div class="text-xs text-muted-foreground">Taklif qilingan do'stlar</div>
          <div class="text-foreground mt-0.5">{{ referralText }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Referal kod</div>
          <div class="text-foreground mt-0.5">{{ member.referral_code }}</div>
        </div>
      </div>
    </div>

    <!-- So'rovlar: foydalanuvchi yuborgan referal mukofot so'rovlari -->
    <div v-if="referralRequests.length" class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">Foydalanuvchi yuborgan so'rovlar</h3>
      <div class="space-y-4">
        <div
          v-for="r in referralRequests"
          :key="r.id"
          class="rounded-xl bg-muted/40 border border-border p-4"
        >
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div class="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Gift class="h-4 w-4 text-primary" /> Referal mukofot so'rovi
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ r.invited_count }} ta do'st taklif qildi — a'zolik +1 oy so'rayapti
              </div>
              <div class="text-[11px] text-muted-foreground mt-1.5">{{ r.when }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-semibold">
                {{ r.invited_count }} / 3 do'st
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
              @click="openRejectRef(r)"
              :disabled="refBusy"
              class="rounded-xl bg-muted hover:bg-accent px-4 py-2 text-sm font-medium text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <X class="h-4 w-4" /> Rad etish
            </button>
            <button
              @click="approveRef(r)"
              :disabled="refBusy"
              class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <Check class="h-4 w-4" /> Tasdiqlash
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment history -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">To'lovlar tarixi</h3>
      <div class="space-y-4">
        <div
          v-for="p in member.payments"
          :key="p.txn_id"
          class="flex items-start justify-between border-b border-border/50 pb-3 last:border-0"
        >
          <div class="flex items-start gap-3">
            <span
              :class="[
                'h-2.5 w-2.5 rounded-full mt-1.5 shrink-0',
                p.status === 'Muvaffaqiyatli' ? 'bg-primary' : p.status === 'Qaytarilgan' ? 'bg-destructive' : 'bg-[#fec84b]',
              ]"
            />
            <div>
              <div class="text-foreground text-sm">
                {{ p.amount }} · {{ p.status === 'Qaytarilgan' ? 'Qaytarilgan' : p.method }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5">
                {{ p.txn_id }} · {{ p.months }}-oy
                <span v-if="p.refund_reason"> · Sabab: {{ p.refund_reason }}</span>
              </div>
            </div>
          </div>
          <span class="text-xs text-muted-foreground shrink-0">{{ p.date }}</span>
        </div>
        <p v-if="!member.payments.length" class="text-sm text-muted-foreground text-center py-4">
          To'lovlar mavjud emas
        </p>
      </div>
    </div>

    <!-- Action bar -->
    <div class="flex flex-wrap items-center justify-center gap-3 pt-2 pb-4">
      <button
        v-if="!member.is_blocked"
        @click="blockOpen = true"
        class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-2 transition-colors"
      >
        <Ban class="h-4 w-4" /> Bloklash
      </button>
      <button
        v-else
        @click="unblock"
        class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-2 transition-colors"
      >
        <Ban class="h-4 w-4" /> Blokdan chiqarish
      </button>
      <button
        @click="extendOpen = true"
        class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-2 transition-colors"
      >
        <CalendarClock class="h-4 w-4" /> Obunani uzaytirish
      </button>
      <button
        @click="sendNotification"
        class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
      >
        <Bell class="h-4 w-4" /> Bildirishnoma yuborish
      </button>
    </div>

    <!-- Block modal -->
    <AppModal
      v-if="blockOpen"
      tone="red"
      title="Foydalanuvchini bloklash"
      subtitle="Bloklangandan so'ng foydalanuvchi ilovaga kira olmaydi va membership to'xtatiladi."
      @close="blockOpen = false"
    >
      <template #icon><AlertTriangle class="h-6 w-6 text-white" /></template>

      <div class="rounded-xl bg-muted/60 p-4 mb-4">
        <div class="text-foreground font-semibold">{{ member.name }}</div>
        <div class="text-xs text-muted-foreground mt-0.5">{{ member.phone }} · #{{ member.member_code }}</div>
      </div>

      <div class="text-xs text-muted-foreground mb-2">Bloklash sababi <span class="text-destructive">*</span></div>
      <div class="space-y-2 mb-3">
        <RadioRow
          v-for="r in blockReasons"
          :key="r"
          :label="r"
          :selected="blockReason === r"
          @select="blockReason = r"
        />
      </div>
      <textarea
        v-model="blockComment"
        placeholder="Sababni yozishingiz mumkin"
        class="w-full min-h-20 rounded-xl bg-muted border border-border p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <template #actions>
        <button
          @click="blockOpen = false"
          class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
        >
          Bekor qilish
        </button>
        <button
          @click="confirmBlock"
          :disabled="blockBusy"
          class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70"
        >
          Bloklash
        </button>
      </template>
    </AppModal>

    <!-- Extend modal -->
    <AppModal
      v-if="extendOpen"
      tone="green"
      title="Obunani uzaytirish"
      @close="extendOpen = false"
    >
      <template #icon><Clock class="h-6 w-6 text-white" /></template>

      <div class="rounded-xl bg-muted/60 p-4 mb-4">
        <div class="text-foreground font-semibold">{{ member.name }}</div>
        <div class="text-xs text-muted-foreground mt-0.5">{{ member.phone }} · #{{ member.member_code }}</div>
      </div>

      <div class="rounded-xl bg-muted/40 p-3 flex items-center justify-between mb-4 text-sm">
        <div>
          <div class="text-xs text-muted-foreground">Joriy obuna tugash sanasi</div>
          <div class="text-foreground font-medium">{{ member.membership_end_fmt ?? '—' }}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-muted-foreground">Qolgan muddat</div>
          <div class="text-foreground font-medium">{{ member.days_left ?? 0 }} kun</div>
        </div>
      </div>

      <div class="text-xs text-muted-foreground mb-2">Uzaytirish muddati <span class="text-destructive">*</span></div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <button
          v-for="m in [1, 3, 6]"
          :key="m"
          @click="extendMonths = m"
          :class="[
            'rounded-xl border p-3 text-center transition-colors',
            extendMonths === m ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted',
          ]"
        >
          <div class="text-xl font-bold text-foreground">{{ m }} <span class="text-xs font-normal">oy</span></div>
          <div class="text-[11px] text-muted-foreground mt-0.5">{{ monthPrices[m] }}</div>
        </button>
      </div>

      <div class="text-xs text-muted-foreground mb-2">Uzaytirish sababi <span class="text-destructive">*</span></div>
      <div class="space-y-2">
        <RadioRow
          v-for="r in extendReasons"
          :key="r"
          :label="r"
          :selected="extendReason === r"
          @select="extendReason = r"
        />
      </div>

      <template #actions>
        <button
          @click="extendOpen = false"
          class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
        >
          Bekor qilish
        </button>
        <button
          @click="confirmExtend"
          :disabled="extendBusy"
          class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70"
        >
          Davom etish
        </button>
      </template>
    </AppModal>

    <!-- Referal so'rovni rad etish modali -->
    <AppModal
      v-if="refRejectOpen"
      tone="red"
      title="So'rovni rad etish"
      subtitle="Rad etish sababi foydalanuvchiga bildirishnoma sifatida yuboriladi."
      @close="refRejectOpen = false"
    >
      <template #icon><AlertTriangle class="h-6 w-6 text-white" /></template>

      <div class="text-xs text-muted-foreground mb-2">Rad etish sababi <span class="text-destructive">*</span></div>
      <textarea
        v-model="refRejectReason"
        placeholder="Masalan: do'stlar hali obuna sotib olmagan"
        class="w-full min-h-20 rounded-xl bg-muted border border-border p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <template #actions>
        <button
          @click="refRejectOpen = false"
          class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
        >
          Bekor qilish
        </button>
        <button
          @click="confirmRejectRef"
          :disabled="refBusy"
          class="flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70"
        >
          Rad etish
        </button>
      </template>
    </AppModal>
  </div>

  <div v-else-if="loading" class="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
</template>
