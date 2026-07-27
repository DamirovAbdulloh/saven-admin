<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { X, Check, FileText, CheckCircle2, Trash2, Info, Search } from 'lucide-vue-next'
import api from '@/api/client'
import { toast } from '@/composables/useToast'
import LocationPicker from '@/components/LocationPicker.vue'
import { REGION_OPTIONS, getDistricts, getRegionLabel } from '@/data/uzRegions'

const emit = defineEmits<{ (e: 'close'): void; (e: 'created'): void }>()

const CATEGORIES = ['Restoran', 'Kafe', 'Fitness', 'Barber', 'Salon', 'Avto', 'Tibbiyot', 'Shifoxona', "Ta'lim", 'Taxi']
const TYPES = [
  { value: 'YaTT', label: 'YaTT' },
  { value: 'MChJ', label: 'MChJ' },
  { value: 'OK', label: 'Oilaviy korxona' },
]
const WORK_DAYS = ['Dushanba – Juma', 'Dushanba – Shanba', 'Har kuni']
// Landing formasi bilan bir xil: chegirma presetlari va qo'llanilish turlari
const DISCOUNT_PRESETS = [5, 10, 15, 20, 25]
const DISCOUNT_SCOPES = ['Barcha mahsulotlar', 'Minimal xarid summasi']

const steps = ['Asosiy', 'Kontakt', 'Joylashuv', 'Chegirma', 'Hujjatlar']
const step = ref(1)

// Login/Telegram/Veb-sayt maydonlarida o'zgarmas qism (@savin.uz, t.me/, www.)
// inputning yonida turadi — foydalanuvchi faqat o'zgaruvchi qismini yozadi.
const LOGIN_SUFFIX = '@savin.uz'
const TELEGRAM_PREFIX = 't.me/'
const WEBSITE_PREFIX = 'www.'
const PHONE_PREFIX = '+998'

// "Ro'yxatdan o'tgan sana" uchun chegara: kelajakdagi yoki 1900 dan oldingi
// sana kiritib bo'lmasin (brauzerning date inputi 67893-yilgacha ruxsat beradi).
const TODAY_ISO = new Date().toISOString().slice(0, 10)
const MIN_DATE_ISO = '1900-01-01'

const form = reactive({
  name: '',
  owner: '',
  category: '',
  business_type: 'YaTT',
  registered_at: '',
  description: '',
  /** Login'ning faqat o'zgaruvchi qismi — to'liq login: `${login_local}@savin.uz` */
  login_local: '',
  password: '',
  /** +998 dan keyingi 9 ta raqam (faqat raqamlar saqlanadi) */
  phone_digits: '',
  instagram: '',
  /** t.me/ dan keyingi qism */
  telegram_handle: '',
  email: '',
  /** www. dan keyingi qism */
  website_domain: '',
  region: '',
  district: '',
  address: '',
  latitude: null as number | null,
  longitude: null as number | null,
  work_days: 'Dushanba – Juma',
  work_hours_from: '09:00',
  work_hours_to: '18:00',
  discount_percent: 15,
  min_purchase: 50000,
  discount_scope: 'Barcha mahsulotlar',
  document_name: '',
  document_size_kb: 0,
})

// Landing formasidagi kabi maydon-darajasidagi xatolar
const fieldErrors = reactive<Record<string, string>>({})
function clearErrors(keys: string[]) {
  keys.forEach((k) => (fieldErrors[k] = ''))
}

// Backend'ga yuboriladigan to'liq qiymatlar (o'zgarmas qism qo'shilgan holda).
// Ixtiyoriy maydonlar bo'sh bo'lsa — faqat prefiks yuborilmasin.
const fullLogin = computed(() =>
  form.login_local.trim() ? `${form.login_local.trim().toLowerCase()}${LOGIN_SUFFIX}` : '',
)
const fullTelegram = computed(() =>
  form.telegram_handle.trim() ? `${TELEGRAM_PREFIX}${form.telegram_handle.trim()}` : '',
)
const fullWebsite = computed(() =>
  form.website_domain.trim() ? `${WEBSITE_PREFIX}${form.website_domain.trim()}` : '',
)

// Viloyatga qarab tumanlar dinamik (landing bilan bir xil manba)
const districtOptions = computed(() => getDistricts(form.region))
watch(
  () => form.region,
  (val, old) => {
    if (val !== old) form.district = ''
  },
)

// ---- Telefon raqami: +998 prefiksi bilan, 9 ta raqam ----
// Ko'rinishi "90 123 45 67" (2-3-2-2), saqlanadigan qiymat esa faqat raqamlar.

/** Raqamlar qatorini "90 123 45 67" ko'rinishiga keltiradi */
function formatPhone(digits: string) {
  const d = digits.slice(0, 9)
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
}

const phoneDisplay = computed(() => formatPhone(form.phone_digits))

/** Kiritilganda raqam bo'lmagan belgilar tashlanadi va 9 ta bilan cheklanadi */
function extractPhoneDigits(raw: string) {
  let d = raw.replace(/\D/g, '')
  // To'liq raqam (+998 90 123 45 67) nusxalab qo'yilsa — davlat kodini olib
  // tashlaymiz. Faqat 9 tadan oshganda, chunki "99 812 34 56" ham haqiqiy
  // raqam bo'lishi mumkin (99 — operator kodi).
  if (d.length > 9 && d.startsWith('998')) d = d.slice(3)
  return d.slice(0, 9)
}

function onPhoneInput(e: Event) {
  const el = e.target as HTMLInputElement
  form.phone_digits = extractPhoneDigits(el.value)
  // Inputni formatlangan ko'rinishga qaytaramiz (v-model ishlatilmagani uchun)
  el.value = formatPhone(form.phone_digits)
}

/** Backend'ga yuboriladigan to'liq raqam: +998901234567 */
const fullPhone = computed(() =>
  form.phone_digits ? `${PHONE_PREFIX}${form.phone_digits}` : '',
)

// ---- Validatsiya (landing ArizaQoldiring.vue bilan bir xil qoidalar) ----

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateStep1() {
  clearErrors(['name', 'owner', 'category', 'business_type', 'registered_at', 'description', 'login', 'password'])
  let ok = true
  if (!form.name.trim()) { fieldErrors.name = 'Biznes nomini kiriting.'; ok = false }
  if (!form.owner.trim()) { fieldErrors.owner = "Mas'ul shaxsning to'liq ismini kiriting."; ok = false }
  if (!form.category) { fieldErrors.category = 'Kategoriyani tanlang.'; ok = false }
  if (!form.business_type) { fieldErrors.business_type = 'Biznes turini tanlang.'; ok = false }
  // Sana ixtiyoriy, lekin kiritilgan bo'lsa mantiqiy oraliqda bo'lishi shart
  if (form.registered_at) {
    if (form.registered_at > TODAY_ISO) {
      fieldErrors.registered_at = "Sana bugundan keyin bo'lishi mumkin emas."
      ok = false
    } else if (form.registered_at < MIN_DATE_ISO) {
      fieldErrors.registered_at = "Sanani to'g'ri kiriting (1900-yildan keyin)."
      ok = false
    }
  }
  if (!form.description.trim()) { fieldErrors.description = 'Faoliyat haqida qisqacha yozing.'; ok = false }
  if (!form.login_local.trim()) {
    fieldErrors.login = 'Panel loginini kiriting.'
    ok = false
  } else if (!/^[a-z0-9][a-z0-9._-]*$/i.test(form.login_local.trim())) {
    fieldErrors.login = 'Login faqat harf, raqam va . _ - belgilaridan iborat bo\'lsin.'
    ok = false
  }
  if (!form.password || form.password.length < 6) {
    fieldErrors.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak."
    ok = false
  }
  return ok
}

function validateStep2() {
  clearErrors(['phone', 'email'])
  let ok = true
  if (form.phone_digits.length !== 9) {
    fieldErrors.phone = "Telefon raqamini to'liq kiriting (9 ta raqam)."
    ok = false
  }
  if (!form.email.trim() || !isValidEmail(form.email)) {
    fieldErrors.email = "Email manzilini to'g'ri kiriting."
    ok = false
  }
  return ok
}

function validateStep3() {
  clearErrors(['region', 'district', 'address', 'location', 'work_days', 'work_hours'])
  let ok = true
  if (!form.region) { fieldErrors.region = 'Viloyatni tanlang.'; ok = false }
  if (!form.district) { fieldErrors.district = 'Tuman/shaharni tanlang.'; ok = false }
  if (!form.address.trim()) { fieldErrors.address = "To'liq manzilni kiriting."; ok = false }
  if (form.latitude == null || form.longitude == null) {
    fieldErrors.location = "Xaritada aniq joyni belgilang (qidiring yoki xaritaga bosing)."
    ok = false
  }
  if (!form.work_days) { fieldErrors.work_days = 'Ish kunlarini tanlang.'; ok = false }
  if (!form.work_hours_from || !form.work_hours_to) {
    fieldErrors.work_hours = 'Ish vaqtini kiriting (dan / gacha).'
    ok = false
  } else if (form.work_hours_from >= form.work_hours_to) {
    fieldErrors.work_hours = "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak."
    ok = false
  }
  return ok
}

function validateStep4() {
  clearErrors(['discount_percent', 'min_purchase', 'discount_scope'])
  let ok = true
  const d = Number(form.discount_percent)
  if (!d) { fieldErrors.discount_percent = 'Chegirma foizini tanlang yoki kiriting.'; ok = false }
  else if (d < 5 || d > 100) {
    fieldErrors.discount_percent = "Chegirma foizi 5 dan 100 gacha bo'lishi kerak."
    ok = false
  }
  if (!form.discount_scope) { fieldErrors.discount_scope = "Qo'llanilish turini tanlang."; ok = false }
  if (form.discount_scope === 'Minimal xarid summasi' && (!form.min_purchase || form.min_purchase <= 0)) {
    fieldErrors.min_purchase = 'Minimal xarid summasini kiriting.'
    ok = false
  }
  return ok
}

function validateStep5() {
  clearErrors(['document_name'])
  if (!form.document_name) {
    fieldErrors.document_name = 'Shartnoma faylini yuklang.'
    return false
  }
  return true
}

// ---- Xarita: manzil bo'yicha qidirish ----
const mapRef = ref<InstanceType<typeof LocationPicker> | null>(null)
const searching = ref(false)

async function searchOnMap() {
  if (!form.address.trim()) {
    fieldErrors.address = 'Avval manzilni kiriting.'
    return
  }
  searching.value = true
  try {
    // Landing kabi: to'liqdan soddaga qarab bosqichma-bosqich qidiramiz
    const regionLabel = getRegionLabel(form.region)
    const queries = [
      ["O'zbekiston", regionLabel, form.district, form.address],
      ["O'zbekiston", regionLabel, form.address],
      [regionLabel, form.address],
      [form.address],
    ]
      .map((parts) => parts.filter(Boolean).join(', '))
      .filter((q, i, arr) => q && arr.indexOf(q) === i)

    for (const q of queries) {
      if (await mapRef.value?.searchAddress(q)) return
    }
    fieldErrors.location = "Manzil topilmadi. Xaritaga bosib joyni qo'lda belgilang."
  } finally {
    searching.value = false
  }
}

function onLocationUpdate(payload: { latitude: number; longitude: number; address?: string }) {
  form.latitude = payload.latitude
  form.longitude = payload.longitude
  fieldErrors.location = ''
  if (payload.address) {
    form.address = payload.address
    fieldErrors.address = ''
  }
}

const showConfirm = ref(false)
const showSuccess = ref(false)
const created = ref<any>(null)
const submitting = ref(false)

function next() {
  const validators = [validateStep1, validateStep2, validateStep3, validateStep4, validateStep5]
  if (!validators[step.value - 1]()) {
    toast.error("Iltimos, belgilangan maydonlarni to'g'ri to'ldiring")
    return
  }
  if (step.value < 5) step.value += 1
  else showConfirm.value = true
}
function back() {
  if (step.value > 1) step.value -= 1
}

// Simulated file upload
function pickFile() {
  form.document_name = 'shartnoma.pdf'
  form.document_size_kb = 520
  fieldErrors.document_name = ''
  toast.success('Fayl yuklandi')
}
function removeFile() {
  form.document_name = ''
  form.document_size_kb = 0
}

async function submit() {
  submitting.value = true
  try {
    const payload: Record<string, any> = {
      name: form.name,
      owner: form.owner,
      category: form.category,
      business_type: form.business_type,
      description: form.description,
      login: fullLogin.value,
      password: form.password,
      phone: fullPhone.value,
      email: form.email,
      instagram: form.instagram,
      telegram: fullTelegram.value,
      website: fullWebsite.value,
      region: getRegionLabel(form.region),
      district: form.district,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      work_days: form.work_days,
      work_hours: `${form.work_hours_from} - ${form.work_hours_to}`,
      discount_percent: Number(form.discount_percent),
      min_purchase: form.min_purchase,
      discount_scope: form.discount_scope,
      document_name: form.document_name,
      document_size_kb: form.document_size_kb,
    }
    if (form.registered_at) payload.registered_at = form.registered_at
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
              <input v-model="form.name" placeholder="Baraka Restoran..." :class="['wz-input', fieldErrors.name && 'wz-invalid']" />
              <p v-if="fieldErrors.name" class="wz-err">{{ fieldErrors.name }}</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Mas'ul shaxs FIO *</label>
              <input v-model="form.owner" placeholder="To'liq ism sharif..." :class="['wz-input', fieldErrors.owner && 'wz-invalid']" />
              <p v-if="fieldErrors.owner" class="wz-err">{{ fieldErrors.owner }}</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Kategoriya *</label>
              <select v-model="form.category" :class="['wz-input', fieldErrors.category && 'wz-invalid']">
                <option value="">Tanlang...</option>
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
              <p v-if="fieldErrors.category" class="wz-err">{{ fieldErrors.category }}</p>
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
            <input
              v-model="form.registered_at"
              type="date"
              :min="MIN_DATE_ISO"
              :max="TODAY_ISO"
              :class="['wz-input', fieldErrors.registered_at && 'wz-invalid']"
            />
            <p v-if="fieldErrors.registered_at" class="wz-err">{{ fieldErrors.registered_at }}</p>
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Biznes haqida qisqacha *</label>
            <textarea
              v-model="form.description"
              placeholder="Biznes faoliyati haqida qisqacha ma'lumot..."
              :class="['wz-input min-h-24 resize-none', fieldErrors.description && 'wz-invalid']"
            />
            <p v-if="fieldErrors.description" class="wz-err">{{ fieldErrors.description }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Login *</label>
              <!-- @savin.uz o'zgarmas — foydalanuvchi faqat chap qismini yozadi -->
              <div :class="['wz-group', fieldErrors.login && 'wz-invalid']">
                <input v-model="form.login_local" placeholder="example" class="wz-group-input" />
                <span class="wz-affix">{{ LOGIN_SUFFIX }}</span>
              </div>
              <p v-if="fieldErrors.login" class="wz-err">{{ fieldErrors.login }}</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Parol *</label>
              <input v-model="form.password" type="password" placeholder="••••••" :class="['wz-input', fieldErrors.password && 'wz-invalid']" />
              <p v-if="fieldErrors.password" class="wz-err">{{ fieldErrors.password }}</p>
            </div>
          </div>
        </template>

        <!-- Step 2: Kontakt -->
        <template v-if="step === 2">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Telefon raqami *</label>
              <!-- +998 o'zgarmas, keyingi qismi 9 ta raqam: "90 123 45 67" -->
              <div :class="['wz-group', fieldErrors.phone && 'wz-invalid']">
                <span class="wz-affix wz-affix-left">{{ PHONE_PREFIX }}</span>
                <input
                  :value="phoneDisplay"
                  @input="onPhoneInput"
                  type="tel"
                  inputmode="numeric"
                  maxlength="12"
                  placeholder="90 123 45 67"
                  class="wz-group-input"
                />
              </div>
              <p v-if="fieldErrors.phone" class="wz-err">{{ fieldErrors.phone }}</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Email manzil *</label>
              <input v-model="form.email" placeholder="info@biznes.uz" :class="['wz-input', fieldErrors.email && 'wz-invalid']" />
              <p v-if="fieldErrors.email" class="wz-err">{{ fieldErrors.email }}</p>
            </div>
          </div>
          <h4 class="text-foreground font-semibold pt-2">Ijtimoiy tarmoqlar</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Instagram</label>
              <input v-model="form.instagram" placeholder="@biznes_uz" class="wz-input" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Telegram kanal</label>
              <!-- t.me/ o'zgarmas prefiks -->
              <div class="wz-group">
                <span class="wz-affix wz-affix-left">{{ TELEGRAM_PREFIX }}</span>
                <input v-model="form.telegram_handle" placeholder="biznes_uz" class="wz-group-input" />
              </div>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Veb-sayt</label>
            <!-- www. o'zgarmas prefiks -->
            <div class="wz-group">
              <span class="wz-affix wz-affix-left">{{ WEBSITE_PREFIX }}</span>
              <input v-model="form.website_domain" placeholder="biznes.uz" class="wz-group-input" />
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
              <select v-model="form.region" :class="['wz-input', fieldErrors.region && 'wz-invalid']">
                <option value="">Tanlang</option>
                <option v-for="r in REGION_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
              <p v-if="fieldErrors.region" class="wz-err">{{ fieldErrors.region }}</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Shahar / Tuman *</label>
              <select
                v-model="form.district"
                :disabled="!form.region"
                :class="['wz-input disabled:opacity-50', fieldErrors.district && 'wz-invalid']"
              >
                <option value="">{{ form.region ? 'Tanlang' : 'Avval viloyatni tanlang' }}</option>
                <option v-for="d in districtOptions" :key="d" :value="d">{{ d }}</option>
              </select>
              <p v-if="fieldErrors.district" class="wz-err">{{ fieldErrors.district }}</p>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">To'liq manzil *</label>
            <div class="flex gap-2">
              <input
                v-model="form.address"
                placeholder="Ko'cha, uy, mo'ljal..."
                @keydown.enter.prevent="searchOnMap"
                :class="['wz-input', fieldErrors.address && 'wz-invalid']"
              />
              <button
                type="button"
                @click="searchOnMap"
                :disabled="searching"
                title="Xaritadan qidirish"
                class="shrink-0 w-11 h-10 rounded-[0.625rem] bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-60"
              >
                <Search class="h-4 w-4" />
              </button>
            </div>
            <p v-if="fieldErrors.address" class="wz-err">{{ fieldErrors.address }}</p>
          </div>

          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Xaritada aniq joylashuvni belgilang *</label>
            <LocationPicker
              ref="mapRef"
              :latitude="form.latitude"
              :longitude="form.longitude"
              :region="form.region"
              :invalid="!!fieldErrors.location"
              @update="onLocationUpdate"
            />
            <p v-if="fieldErrors.location" class="wz-err">{{ fieldErrors.location }}</p>
          </div>

          <h4 class="text-foreground font-semibold pt-2">Ish vaqti</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Ish kunlari *</label>
              <select v-model="form.work_days" :class="['wz-input', fieldErrors.work_days && 'wz-invalid']">
                <option v-for="d in WORK_DAYS" :key="d" :value="d">{{ d }}</option>
              </select>
              <p v-if="fieldErrors.work_days" class="wz-err">{{ fieldErrors.work_days }}</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1.5">Ish vaqti *</label>
              <div class="flex items-center gap-2">
                <input v-model="form.work_hours_from" type="time" :class="['wz-input text-center', fieldErrors.work_hours && 'wz-invalid']" />
                <span class="text-muted-foreground shrink-0">—</span>
                <input v-model="form.work_hours_to" type="time" :class="['wz-input text-center', fieldErrors.work_hours && 'wz-invalid']" />
              </div>
              <p v-if="fieldErrors.work_hours" class="wz-err">{{ fieldErrors.work_hours }}</p>
            </div>
          </div>
        </template>

        <!-- Step 4: Chegirma -->
        <template v-if="step === 4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">Chegirma foizi *</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in DISCOUNT_PRESETS"
                :key="p"
                type="button"
                @click="form.discount_percent = p"
                :class="[
                  'px-4 py-2 text-sm font-semibold rounded-full border transition-colors',
                  form.discount_percent === p
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50',
                ]"
              >
                {{ p }}%
              </button>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Boshqa foiz:</span>
              <div class="relative">
                <input
                  v-model.number="form.discount_percent"
                  type="number"
                  min="5"
                  max="100"
                  :class="['wz-input w-28 pr-7', fieldErrors.discount_percent && 'wz-invalid']"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
            <p v-if="fieldErrors.discount_percent" class="wz-err">{{ fieldErrors.discount_percent }}</p>
          </div>

          <div>
            <label class="text-xs text-muted-foreground block mb-1.5">Chegirma qo'llanilish turi *</label>
            <select v-model="form.discount_scope" :class="['wz-input', fieldErrors.discount_scope && 'wz-invalid']">
              <option v-for="s in DISCOUNT_SCOPES" :key="s" :value="s">{{ s }}</option>
            </select>
            <p v-if="fieldErrors.discount_scope" class="wz-err">{{ fieldErrors.discount_scope }}</p>
          </div>

          <div v-if="form.discount_scope === 'Minimal xarid summasi'">
            <label class="text-xs text-muted-foreground block mb-1.5">Min. xarid summasi (so'm) *</label>
            <input v-model.number="form.min_purchase" type="number" :class="['wz-input', fieldErrors.min_purchase && 'wz-invalid']" />
            <p v-if="fieldErrors.min_purchase" class="wz-err">{{ fieldErrors.min_purchase }}</p>
          </div>
        </template>

        <!-- Step 5: Hujjatlar -->
        <template v-if="step === 5">
          <label class="text-xs text-muted-foreground block mb-1.5">Shartnoma (PDF) *</label>
          <div
            :class="[
              'rounded-xl bg-muted/40 border border-dashed p-6 text-center',
              fieldErrors.document_name ? 'border-destructive' : 'border-border',
            ]"
          >
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
          <p v-if="fieldErrors.document_name" class="wz-err">{{ fieldErrors.document_name }}</p>
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
        <span class="text-xs text-muted-foreground">{{ step }}/{{ steps.length }} bosqich</span>
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
              <div class="flex justify-between"><dt class="text-muted-foreground">Login:</dt><dd class="text-foreground">{{ fullLogin }}</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">2. Kontakt</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Telefon:</dt><dd class="text-foreground">{{ form.phone_digits ? `${PHONE_PREFIX} ${phoneDisplay}` : '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Email:</dt><dd class="text-foreground">{{ form.email || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Instagram:</dt><dd class="text-foreground">{{ form.instagram || '—' }}</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">3. Joylashuv</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Viloyat:</dt><dd class="text-foreground">{{ getRegionLabel(form.region) || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Shahar:</dt><dd class="text-foreground">{{ form.district || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Manzil:</dt><dd class="text-foreground text-right max-w-[60%]">{{ form.address || '—' }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Lokatsiya:</dt><dd class="text-foreground">{{ form.latitude?.toFixed(5) }}, {{ form.longitude?.toFixed(5) }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Ish kunlari:</dt><dd class="text-foreground">{{ form.work_days }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Ish vaqti:</dt><dd class="text-foreground">{{ form.work_hours_from }} - {{ form.work_hours_to }}</dd></div>
            </dl>
          </div>
          <div class="rounded-xl bg-muted/40 border border-border p-4">
            <div class="text-sm font-semibold text-foreground mb-3">4. Chegirma</div>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted-foreground">Chegirma %:</dt><dd class="text-foreground">{{ form.discount_percent }}%</dd></div>
              <div class="flex justify-between"><dt class="text-muted-foreground">Turi:</dt><dd class="text-foreground">{{ form.discount_scope }}</dd></div>
              <div v-if="form.discount_scope === 'Minimal xarid summasi'" class="flex justify-between">
                <dt class="text-muted-foreground">Min. xarid:</dt><dd class="text-foreground">{{ form.min_purchase.toLocaleString() }} so'm</dd>
              </div>
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
/* O'zgarmas prefiks/suffiks bilan input guruhi (@savin.uz, t.me/, www.) */
.wz-group {
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.5rem;
  border-radius: 0.625rem;
  background: var(--color-muted);
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.wz-group:focus-within {
  box-shadow: 0 0 0 2px var(--color-ring);
}
.wz-group-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: transparent;
  border: none;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-foreground);
}
.wz-group-input:focus {
  outline: none;
}
.wz-affix {
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
  white-space: nowrap;
  user-select: none;
}
/* Chapdagi prefiks uchun o'ng tomonda ajratuvchi chiziq */
.wz-affix-left {
  border-right: 1px solid var(--color-border);
  padding-right: 0.625rem;
}

/* Xato holatidagi maydon — landing formasidagi qizil chegara bilan bir xil */
.wz-invalid {
  border-color: var(--color-destructive);
}
.wz-err {
  font-size: 0.75rem;
  color: var(--color-destructive);
  margin-top: 0.375rem;
}
</style>
