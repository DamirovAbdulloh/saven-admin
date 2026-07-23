<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, RefreshCw } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import AppModal from '@/components/AppModal.vue'
import RadioRow from '@/components/RadioRow.vue'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

const payment = ref<any>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/payments/${route.params.txn}/`)
    payment.value = data
  } catch {
    toast.error("Ma'lumotni yuklab bo'lmadi")
    router.push('/payments')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const refundOpen = ref(false)
const refundReason = ref('Foydalanuvchi so\'rovi')
const refundComment = ref('')
const refundReasons = ["Foydalanuvchi so'rovi", 'Texnik xatolik', 'Ikki marta to\'langan', 'Boshqa sabab']
const refundBusy = ref(false)

async function confirmRefund() {
  refundBusy.value = true
  try {
    const { data } = await api.post(`/payments/${payment.value.txn_id}/refund/`, {
      reason: refundReason.value,
      comment: refundComment.value,
    })
    payment.value = data
    refundOpen.value = false
    toast.error('Qaytarish amalga oshirildi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    refundBusy.value = false
  }
}
</script>

<template>
  <div v-if="payment" class="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <RouterLink to="/payments" class="hover:text-foreground">To'lovlar</RouterLink>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">{{ payment.user_display_name }}</span>
    </div>

    <!-- Payment details -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <div class="flex items-start justify-between mb-5">
        <h3 class="text-foreground font-semibold text-lg">To'lov tafsilotlari</h3>
        <StatusBadge :status="payment.status" />
      </div>
      <div class="grid grid-cols-2 gap-y-5">
        <div><div class="text-xs text-muted-foreground">To'lov summasi</div><div class="text-foreground mt-0.5 font-medium">{{ payment.amount_fmt }}</div></div>
        <div><div class="text-xs text-muted-foreground">To'lov usuli</div><div class="text-foreground mt-0.5">{{ payment.method }}</div></div>
        <div><div class="text-xs text-muted-foreground">To'lov sanasi</div><div class="text-foreground mt-0.5">{{ payment.date }}</div></div>
        <div><div class="text-xs text-muted-foreground">Tranzaksiya ID</div><div class="text-foreground mt-0.5 font-mono text-sm">{{ payment.txn_id }}</div></div>
        <div><div class="text-xs text-muted-foreground">To'lov tizimi ref</div><div class="text-foreground mt-0.5 font-mono text-sm">{{ payment.psp_ref }}</div></div>
        <div><div class="text-xs text-muted-foreground">Obuna davri</div><div class="text-foreground mt-0.5">{{ payment.period ?? '—' }}</div></div>
      </div>
      <div v-if="payment.refund_reason" class="mt-5 rounded-xl bg-destructive/10 border border-destructive/30 p-3">
        <div class="text-xs text-destructive font-medium">Qaytarish sababi</div>
        <div class="text-sm text-foreground mt-0.5">{{ payment.refund_reason }}<span v-if="payment.refund_comment"> — {{ payment.refund_comment }}</span></div>
      </div>
    </div>

    <!-- Member info -->
    <div v-if="payment.member_info" class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-5">A'zo ma'lumotlari</h3>
      <div class="grid grid-cols-2 gap-y-5">
        <div><div class="text-xs text-muted-foreground">A'zolik holati</div><div class="text-foreground mt-0.5">{{ payment.member_info.status }}</div></div>
        <div><div class="text-xs text-muted-foreground">Jami to'lovlar soni</div><div class="text-foreground mt-0.5">{{ payment.member_info.payments_count }}</div></div>
        <div><div class="text-xs text-muted-foreground">Keyingi to'lov</div><div class="text-foreground mt-0.5">{{ payment.member_info.next_payment ?? '- Obuna yo\'q' }}</div></div>
        <div><div class="text-xs text-muted-foreground">Jami tejagan</div><div class="text-foreground mt-0.5">{{ payment.member_info.savings }}</div></div>
      </div>
    </div>

    <!-- Payment history -->
    <div class="rounded-2xl bg-card border border-border p-6">
      <h3 class="text-foreground font-semibold text-lg mb-4">To'lovlar tarixi</h3>
      <div class="space-y-4">
        <div v-for="p in payment.history" :key="p.txn_id" class="flex items-start justify-between border-b border-border/50 pb-3 last:border-0">
          <div class="flex items-start gap-3">
            <span :class="['h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', p.status === 'Muvaffaqiyatli' ? 'bg-primary' : p.status === 'Qaytarilgan' ? 'bg-destructive' : 'bg-[oklch(0.7_0.15_75)]']" />
            <div>
              <div class="text-foreground text-sm">{{ p.amount }} · {{ p.status === 'Qaytarilgan' ? 'Qaytarilgan' : p.method }}</div>
              <div class="text-xs text-muted-foreground mt-0.5">{{ p.txn_id }} · {{ p.months }}-oy</div>
            </div>
          </div>
          <span class="text-xs text-muted-foreground shrink-0">{{ p.date }}</span>
        </div>
      </div>
    </div>

    <!-- Action bar -->
    <div class="flex items-center justify-center gap-3 pt-2 pb-4">
      <button
        @click="router.push('/payments')"
        class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
      >
        Qaytarish
      </button>
      <button
        v-if="payment.status !== 'Qaytarilgan'"
        @click="refundOpen = true"
        class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
      >
        <RefreshCw class="h-4 w-4" /> Qaytarish (Refund)
      </button>
      <button
        v-if="payment.member_id"
        @click="router.push(`/users/${payment.member_id}`)"
        class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        Profilga o'tish
      </button>
    </div>

    <!-- Refund modal -->
    <AppModal
      v-if="refundOpen"
      title="Qaytarishni tasdiqlang"
      :subtitle="`${payment.user_display_name} uchun ${payment.amount_fmt} qaytariladi.\nBu amalni bekor qilib bo'lmaydi.`"
      @close="refundOpen = false"
    >
      <div class="rounded-xl bg-muted/60 p-4 mb-4 space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-muted-foreground">Foydalanuvchi</span><span class="text-foreground">{{ payment.user_display_name }} · #{{ payment.member_info?.member_code }}</span></div>
        <div class="flex justify-between"><span class="text-muted-foreground">Tranzaksiya</span><span class="text-foreground font-mono">{{ payment.txn_id }}</span></div>
        <div class="flex justify-between"><span class="text-muted-foreground">Qaytariladigan summa</span><span class="text-foreground">−{{ payment.amount_fmt }}</span></div>
        <div class="flex justify-between"><span class="text-muted-foreground">Membership holati</span><span class="text-foreground">Bekor qilinadi</span></div>
        <div class="flex justify-between"><span class="text-muted-foreground">SMS yuboriladi</span><span class="text-foreground">Ha — avtomatik</span></div>
      </div>

      <div class="text-xs text-muted-foreground mb-2">Qaytarish sababi <span class="text-destructive">*</span></div>
      <div class="space-y-2 mb-3">
        <RadioRow v-for="r in refundReasons" :key="r" :label="r" :selected="refundReason === r" @select="refundReason = r" />
      </div>
      <textarea
        v-if="refundReason === 'Boshqa sabab'"
        v-model="refundComment"
        placeholder="Qo'shimcha qaytarish sababini yozishingiz mumkin"
        class="w-full min-h-20 rounded-xl bg-muted border border-border p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <template #actions>
        <button @click="refundOpen = false" class="flex-1 rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors">
          Bekor qilish
        </button>
        <button @click="confirmRefund" :disabled="refundBusy" class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70">
          Qaytarishni tasdiqlash
        </button>
      </template>
    </AppModal>
  </div>

  <div v-else-if="loading" class="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
</template>
