<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { X, Check, FileText, CheckCircle2, Trash2, Info } from 'lucide-vue-next'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const emit = defineEmits<{ (e: 'close'): void; (e: 'created'): void }>()

const CATEGORIES = ['Restoran', 'Kafe', 'Fitness', 'Barber', 'Salon', 'Avto', 'Tibbiyot', 'Shifoxona', "Ta'lim", 'Taxi']
const TYPES = [
  { value: 'YaTT', label: 'YaTT' },
  { value: 'MChJ', label: 'MChJ' },
  { value: 'OK', label: 'Oilaviy korxona' },
]
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
const DISTRICTS = ['Chilonzor tumani', 'Yunusobod tumani', 'Mirzo Ulug\'bek tumani', 'Yakkasaroy tumani', 'Shayxontohur tumani', 'Sergeli tumani']
const WORK_DAYS = ['Dushanba – Juma', 'Dushanba – Shanba', 'Har kuni']
const WORK_HOURS = ['09:00 - 18:00', '09:00 - 22:00', '10:00 - 20:00', '08:00 - 23:00']

const steps = ['Asosiy', 'Kontakt', 'Joylashuv', 'Chegirma', 'Hujjatlar']
const step = ref(1)

const form = reactive({
  name: '',
  owner: '',
  category: '',
  business_type: 'YaTT',
  registered_at: '',
  description: '',
  login: '',
  password: '',
  phone: '',
  instagram: '',
  telegram: '',
  email: '',
  website: '',
  region: '',
  district: '',
  address: '',
  work_days: 'Dushanba – Juma',
  work_hours: '09:00 - 18:00',
  discount_percent: 5,
  min_purchase: 50000,
  document_name: '',
  document_size_kb: 0,
})

const showConfirm = ref(false)
const showSuccess = ref(false)
const created = ref<any>(null)
const submitting = ref(false)

const step1Valid = computed(() => form.name && form.owner && form.category && form.login && form.password)

function next() {
  if (step.value === 1 && !step1Valid.value) {
    toast.error("Majburiy maydonlarni to'ldiring")
    return
  }
  if (step.value < 5) {
    step.value += 1
  } else {
    showConfirm.value = true
  }
}
function back() {
  if (step.value > 1) step.value -= 1
}

// Simulated file upload
function pickFile() {
  form.document_name = 'shartnoma.pdf'
  form.document_size_kb = 520
  toast.success('Fayl yuklandi')
}
function removeFile() {
  form.document_name = ''
  form.document_size_kb = 0
}

async function submit() {
  submitting.value = true
  try {
    const payload = { ...form }
    if (!payload.registered_at) delete (payload as any).registered_at
    const { data } = await api.post('/businesses/', payload)
    created.value = data
    showConfirm.value = false
    showSuccess.value = true
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- Slide-over drawer -->
  <div class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" @click.self="emit('close')">
    <div class="w-full max-w-lg h-full bg-popover border-l border-border overflow-y-auto flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-popover z-10">
        <h2 class="text-lg font-bold text-foreground">Yangi biznes qo'shish</h2>
        <button @click="emit('close')" class="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center px-6 py-4">
        <template v-for="(s, i) in steps" :key="s">
          <div class="flex flex-col items-center gap-1 shrink-0">
            <div
              :class="[
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step > i + 1 ? 'bg-primary text-primary-foreground' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              ]"
            >
              <Check v-if="step > i + 1" class="h-4 w-4" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span :class="['text-[11px]', step >= i + 1 ? 'text-foreground' : 'text-muted-foreground']">{{ s }}</span>
          </div>
          <div v-if="i < steps.length - 1" :class="['flex-1 h-px mx-1', step > i + 1 ? 'bg-primary' : 'bg-border']" />
        </template>
      </div>

      <p class="px-6 text-xs text-muted-foreground">* belgisi bilan belgilangan maydonlar to'ldirilishi shart</p>

      <!-- Step body -->
      <div class="flex-1 px-6 py-4 space-y-4">
        <!-- Step 1: Asosiy -->
        <template v-if="step === 1">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Biznes nomi *</label>
              <input v-model="form.name" placeholder="Baraka Restoran..." class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Mas'ul shaxs FIO *</label>
              <input v-model="form.owner" placeholder="To'liq ism sharif..." class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Kategoriya *</label>
              <select v-model="form.category" class="wz-input">
                <option value="">Tanlang...</option>
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Biznes turi *</label>
              <select v-model="form.business_type" class="wz-input">
                <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Ro'yxatdan o'tgan sana</label>
            <input v-model="form.registered_at" type="date" class="wz-input" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Biznes haqida qisqacha</label>
            <textarea v-model="form.description" placeholder="Biznes faoliyati haqida qisqacha ma'lumot..." class="wz-input min-h-24 resize-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Login *</label>
              <input v-model="form.login" placeholder="Login" class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Parol *</label>
              <input v-model="form.password" placeholder="Parol" class="wz-input" />
            </div>
          </div>
        </template>

        <!-- Step 2: Kontakt -->
        <template v-if="step === 2">
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Telefon raqami *</label>
            <input v-model="form.phone" placeholder="+998 90 000 00 00" class="wz-input" />
          </div>
          <h4 class="text-foreground font-semibold pt-2">Ijtimoiy tarmoqlar</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Instagram</label>
              <input v-model="form.instagram" placeholder="@biznes_uz" class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Telegram kanal</label>
              <input v-model="form.telegram" placeholder="t.me/biznes_uz" class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Email manzil</label>
              <input v-model="form.email" placeholder="info@biznes.uz" class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Veb-sayt</label>
              <input v-model="form.website" placeholder="www.biznes.uz" class="wz-input" />
            </div>
          </div>
          <div class="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-center gap-2 text-xs text-primary mt-2">
            <Info class="h-4 w-4 shrink-0" />
            Mijozlar biznes bilan bog'lanish uchun ushbu ma'lumotlardan foydalanadi
          </div>
        </template>

        <!-- Step 3: Joylashuv -->
        <template v-if="step === 3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Viloyat *</label>
              <select v-model="form.region" class="wz-input">
                <option value="">Tanlang</option>
                <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Shahar / Tuman *</label>
              <select v-model="form.district" class="wz-input">
                <option value="">Tanlang</option>
                <option v-for="d in DISTRICTS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">To'liq manzil *</label>
            <input v-model="form.address" placeholder="Ko'cha, uy, mo'ljal..." class="wz-input" />
          </div>
          <div class="rounded-xl bg-muted/60 border border-border h-40 flex items-center justify-center text-sm text-muted-foreground">
            Xaritada ko'rsatish
          </div>
          <h4 class="text-foreground font-semibold pt-2">Ish vaqti</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Ish kunlari</label>
              <select v-model="form.work_days" class="wz-input">
                <option v-for="d in WORK_DAYS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Ish vaqti</label>
              <select v-model="form.work_hours" class="wz-input">
                <option v-for="h in WORK_HOURS" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>
        </template>

        <!-- Step 4: Chegirma -->
        <template v-if="step === 4">
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Chegirma foizi *</label>
            <input
              :value="form.discount_percent + '%'"
              readonly
              class="wz-input"
            />
            <input
              v-model.number="form.discount_percent"
              type="range"
              min="1"
              max="20"
              class="w-full accent-[oklch(0.87_0.22_135)] mt-2"
            />
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>20%</span>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Min. xarid summasi (so'm)</label>
            <input v-model.number="form.min_purchase" type="number" class="wz-input" />
          </div>
          <h4 class="text-foreground font-semibold pt-2">Chegirma qo'llanilish turi</h4>
          <span class="inline-flex items-center rounded-lg bg-primary/15 text-primary px-3 py-1.5 text-sm">Barcha mahsulotlar</span>
        </template>

        <!-- Step 5: Hujjatlar -->
        <template v-if="step === 5">
          <label class="text-xs text-muted-foreground block mb-1.5">Shartnoma (PDF) *</label>
          <div class="rounded-xl bg-muted/40 border border-dashed border-border p-6 text-center">
            <FileText class="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p class="text-sm text-foreground mb-1">Bino kadastr hujjati va ijara shartnomani yuklang</p>
            <p class="text-xs text-muted-foreground mb-3">PDF, JPEG, PNG (10 MB gacha)</p>
            <button
              @click="pickFile"
              class="rounded-lg bg-primary/15 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/25 transition-colors"
            >
              Faylni yuklash
            </button>
          </div>
          <div
            v-if="form.document_name"
            class="rounded-xl bg-muted/60 border border-primary/40 p-3 flex items-center justify-between mt-3"
          >
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-destructive/20 flex items-center justify-center text-destructive text-xs font-bold">PDF</div>
              <div>
                <div class="text-sm text-foreground">{{ form.document_name }}</div>
                <div class="text-xs text-primary">{{ form.document_size_kb }} KB · Yuklandi</div>
              </div>
            </div>
            <button @click="removeFile" class="text-muted-foreground hover:text-destructive">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-border sticky bottom-0 bg-popover">
        <button
          @click="step === 1 ? emit('close') : back()"
          class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
        >
          {{ step === 1 ? 'Bekor qilish' : 'Orqaga' }}
        </button>
        <button
          @click="next"
          class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          {{ step === 5 ? 'Yakunlash' : 'Keyingi' }}
        </button>
      </div>
    </div>

    <!-- Confirm modal -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm"
      @click.self="showConfirm = false"
    >
      <div class="w-full max-w-lg h-full bg-popover border-l border-border overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-bold text-foreground">Ma'lumotlarni tasdiqlang</h2>
          <button @click="showConfirm = false" class="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent">
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">1. Asosiy ma'lumotlar</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Biznes nomi:</dt><dd class="text-foreground">{{ form.name }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Kategoriya:</dt><dd class="text-foreground">{{ form.category }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Biznes turi:</dt><dd class="text-foreground">{{ form.business_type }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Mas'ul shaxs:</dt><dd class="text-foreground">{{ form.owner }}</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">2. Kontakt</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Telefon:</dt><dd class="text-foreground">{{ form.phone || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Email:</dt><dd class="text-foreground">{{ form.email || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Instagram:</dt><dd class="text-foreground">{{ form.instagram || '—' }}</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">3. Joylashuv</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Viloyat:</dt><dd class="text-foreground">{{ form.region || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Shahar:</dt><dd class="text-foreground">{{ form.district || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Manzil:</dt><dd class="text-foreground">{{ form.address || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Ish vaqti:</dt><dd class="text-foreground">{{ form.work_hours }}</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">4. Chegirma</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Chegirma %:</dt><dd class="text-foreground">{{ form.discount_percent }}%</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Min. xarid:</dt><dd class="text-foreground">{{ form.min_purchase.toLocaleString() }} so'm</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Turi:</dt><dd class="text-foreground">Barcha mahsulotlar</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">5. Hujjatlar</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Shartnoma:</dt>
                <dd class="text-foreground">{{ form.document_name || '(yuklanmagan)' }} <Check v-if="form.document_name" class="inline h-3.5 w-3.5 text-primary" /></dd>
              </div>
            </dl>
          </div>
        </div>
        <div class="flex items-center justify-between px-6 py-4 border-t border-border sticky bottom-0 bg-popover">
          <button @click="showConfirm = false" class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors">
            Bekor qilish
          </button>
          <button
            @click="submit"
            :disabled="submitting"
            class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70"
          >
            {{ submitting ? 'Yaratilmoqda...' : 'Biznes yaratish' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success modal -->
    <div v-if="showSuccess" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div class="w-full max-w-sm rounded-3xl bg-popover border border-border p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-[oklch(0.55_0.15_155)] mx-auto mb-5 flex items-center justify-center">
          <CheckCircle2 class="h-8 w-8 text-white" />
        </div>
        <h2 class="text-xl font-bold text-foreground mb-1">Biznes muvaffaqiyatli yaratildi!</h2>
        <span class="inline-flex items-center rounded-full bg-[oklch(0.55_0.14_65)]/30 text-[oklch(0.85_0.14_65)] px-3 py-0.5 text-xs mb-5">Kutilmoqda</span>
        <dl class="space-y-1.5 text-sm mb-6">
          <div class="flex justify-between"><dt class="text-muted-foreground">Biznes ID:</dt><dd class="text-foreground font-mono">{{ created?.business_code }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted-foreground">Yaratilgan:</dt><dd class="text-foreground">{{ created?.date }}</dd></div>
        </dl>
        <div class="flex items-center gap-3">
          <button
            @click="emit('created')"
            class="flex-1 rounded-xl bg-muted hover:bg-accent px-4 py-2.5 text-sm font-medium text-foreground transition-colors"
          >
            Ro'yxatga qaytish
          </button>
          <button
            @click="$router.push(`/businesses/${created.id}`)"
            class="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            Biznesni ko'rish
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wz-input {
  width: 100%;
  height: 2.5rem;
  border-radius: 0.625rem;
  background: var(--color-muted);
  border: 1px solid var(--color-border);
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-foreground);
}
.wz-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-ring);
}
textarea.wz-input {
  height: auto;
  padding: 0.5rem 0.75rem;
}
</style>
