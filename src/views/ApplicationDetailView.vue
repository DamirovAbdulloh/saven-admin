<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Check, X, AlertTriangle } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import AppModal from '@/components/AppModal.vue'
import LocationMap from '@/components/LocationMap.vue'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

const app = ref<any>(null)
const loading = ref(true)
const rejectOpen = ref(false)
const rejectReason = ref('')
const acting = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/applications/${route.params.id}/`)
    app.value = data
  } catch {
    toast.error("Ma'lumotni yuklab bo'lmadi")
    router.push('/businesses/applications')
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function approve() {
  if (acting.value) return
  acting.value = true
  try {
    const { data } = await api.post(`/applications/${app.value.id}/approve/`)
    app.value = data
    toast.success("Tasdiqlandi — biznes 'Bizneslar' ro'yxatiga qo'shildi")
  } catch (e: any) {
    toast.error(e?.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    acting.value = false
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    toast.error('Rad etish sababini kiriting')
    return
  }
  if (acting.value) return
  acting.value = true
  try {
    const { data } = await api.post(`/applications/${app.value.id}/reject/`, {
      reason: rejectReason.value,
    })
    app.value = data
    rejectOpen.value = false
    toast.error('Ariza rad etildi')
  } catch (e: any) {
    toast.error(e?.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <div v-if="app" class="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <RouterLink to="/businesses/applications" class="hover:text-foreground">Arizalar</RouterLink>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">{{ app.business_name }}</span>
      <div class="ml-auto"><StatusBadge :status="app.status" variant="application" /></div>
    </div>

    <!-- Ariza ma'lumotlari (landing saytida kiritilganlar) -->
    <div class="rounded-2xl bg-card border border-border p-6 space-y-8">
      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Biznes ma'lumotlari</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div><div class="text-xs text-muted-foreground">Biznes nomi</div><div class="text-foreground mt-0.5">{{ app.business_name }}</div></div>
          <div><div class="text-xs text-muted-foreground">Kategoriya</div><div class="text-foreground mt-0.5">{{ app.category }}</div></div>
          <div><div class="text-xs text-muted-foreground">Biznes turi</div><div class="text-foreground mt-0.5">{{ app.business_type || '—' }}</div></div>
          <div><div class="text-xs text-muted-foreground">Mas'ul shaxs</div><div class="text-foreground mt-0.5">{{ app.responsible_name || '—' }}</div></div>
          <div class="col-span-2" v-if="app.description">
            <div class="text-xs text-muted-foreground">Faoliyat tavsifi</div>
            <div class="text-foreground mt-0.5">{{ app.description }}</div>
          </div>
        </div>
      </section>

      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Kontakt</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div><div class="text-xs text-muted-foreground">Telefon</div><div class="text-foreground mt-0.5">{{ app.phone }}</div></div>
          <div><div class="text-xs text-muted-foreground">Email</div><div class="text-foreground mt-0.5">{{ app.email || '—' }}</div></div>
          <div><div class="text-xs text-muted-foreground">Instagram</div><div class="text-foreground mt-0.5">{{ app.instagram || '—' }}</div></div>
          <div><div class="text-xs text-muted-foreground">Telegram</div><div class="text-foreground mt-0.5">{{ app.telegram || '—' }}</div></div>
          <div><div class="text-xs text-muted-foreground">Veb-sayt</div><div class="text-foreground mt-0.5">{{ app.website || '—' }}</div></div>
          <div><div class="text-xs text-muted-foreground">Ish vaqti</div><div class="text-foreground mt-0.5">{{ app.work_hours || '—' }}<template v-if="app.work_days">, {{ app.work_days }}</template></div></div>
        </div>
      </section>

      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Manzil</h3>
        <div class="grid grid-cols-2 gap-y-4 mb-4">
          <div><div class="text-xs text-muted-foreground">Viloyat</div><div class="text-foreground mt-0.5">{{ app.region }}</div></div>
          <div><div class="text-xs text-muted-foreground">Shahar / Tuman</div><div class="text-foreground mt-0.5">{{ app.district || '—' }}</div></div>
        </div>
        <div class="text-xs text-muted-foreground">To'liq manzil</div>
        <div class="text-foreground mt-0.5 mb-4">{{ app.address || '—' }}</div>
        <!-- Biznes egasi arizada xaritada belgilagan lokatsiya -->
        <LocationMap :latitude="app.latitude" :longitude="app.longitude" :label="app.business_name" />
      </section>

      <section>
        <h3 class="text-foreground font-semibold text-lg mb-4">Chegirma</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div>
            <div class="text-xs text-muted-foreground">Chegirma foizi</div>
            <div class="mt-1"><span class="inline-flex items-center rounded-full bg-primary/15 text-primary px-3 py-1 text-sm font-semibold">{{ app.discount_percent }}%</span></div>
          </div>
          <div><div class="text-xs text-muted-foreground">Qo'shimcha turi</div><div class="text-foreground mt-0.5">{{ app.discount_scope || '—' }}</div></div>
          <div><div class="text-xs text-muted-foreground">Min. xarid summasi</div><div class="text-foreground mt-0.5">{{ app.min_purchase_fmt }}</div></div>
          <div><div class="text-xs text-muted-foreground">Yuborilgan sana</div><div class="text-foreground mt-0.5">{{ app.date }}</div></div>
        </div>
      </section>

      <!-- Parol ATAYLAB ko'rsatilmaydi: biznes egasining paroli admin
           xodimlariga ochiq ko'rinmasligi kerak. Faqat login ko'rsatiladi. -->
      <section v-if="app.login">
        <h3 class="text-foreground font-semibold text-lg mb-4">Kirish ma'lumotlari</h3>
        <div class="grid grid-cols-2 gap-y-4">
          <div><div class="text-xs text-muted-foreground">Login</div><div class="text-foreground mt-0.5">{{ app.login }}</div></div>
          <div><div class="text-xs text-muted-foreground">Parol</div><div class="text-muted-foreground mt-0.5 italic">Yashirilgan</div></div>
        </div>
      </section>

      <section v-if="app.reject_reason" class="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
        <div class="text-xs text-destructive font-medium">Rad etish sababi</div>
        <div class="text-sm text-foreground mt-1">{{ app.reject_reason }}</div>
      </section>
    </div>

    <!-- Action bar: Rad etish / Tasdiqlash -->
    <div
      v-if="app.status !== 'Tasdiqlangan' && app.status !== 'Rad etildi' && app.status !== 'Biznes yaratildi'"
      class="flex flex-wrap items-center justify-center gap-3 pt-2 pb-4"
    >
      <button
        @click="rejectOpen = true"
        :disabled="acting"
        class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-2 transition-colors disabled:opacity-60"
      >
        <X class="h-4 w-4" /> Rad etish
      </button>
      <button
        @click="approve"
        :disabled="acting"
        class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
      >
        <Check class="h-4 w-4" /> Tasdiqlash
      </button>
    </div>
    <div v-else-if="app.status === 'Tasdiqlangan' && app.created_business_id" class="flex justify-center pb-4">
      <RouterLink
        :to="`/businesses/${app.created_business_id}`"
        class="rounded-xl bg-primary/15 text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/25 transition-colors"
      >
        Yaratilgan biznesni ko'rish →
      </RouterLink>
    </div>

    <!-- Rad etish modali -->
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
  </div>

  <div v-else-if="loading" class="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
</template>
