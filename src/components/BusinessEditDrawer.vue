<script setup lang="ts">
import { reactive, ref } from 'vue'
import { X } from 'lucide-vue-next'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const props = defineProps<{ business: any }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', updated: any): void }>()

const CATEGORIES = ['Restoran', 'Kafe', 'Fitness', 'Barber', 'Salon', 'Avto', 'Tibbiyot', 'Shifoxona', "Ta'lim", 'Taxi']
const TYPES = ['YaTT', 'MChJ', 'OK']
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

const tab = ref<'asosiy' | 'kontakt' | 'joylashuv' | 'chegirma'>('asosiy')
const tabs = [
  { key: 'asosiy', label: 'Asosiy' },
  { key: 'kontakt', label: 'Kontakt' },
  { key: 'joylashuv', label: 'Joylashuv' },
  { key: 'chegirma', label: 'Chegirma' },
] as const

const form = reactive({
  name: props.business.name,
  owner: props.business.owner,
  category: props.business.category,
  business_type: props.business.business_type,
  description: props.business.description,
  login: props.business.login,
  password: props.business.password,
  phone: props.business.phone,
  email: props.business.email,
  instagram: props.business.instagram,
  telegram: props.business.telegram,
  website: props.business.website,
  region: props.business.region,
  district: props.business.district,
  address: props.business.address,
  discount_percent: props.business.discount_percent,
  min_purchase: Number(props.business.min_purchase),
})
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    const { data } = await api.patch(`/businesses/${props.business.id}/`, form)
    emit('saved', data)
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="w-full max-w-lg h-full bg-popover border-l border-border overflow-y-auto flex flex-col">
      <div class="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-popover z-10">
        <div>
          <h2 class="text-lg font-bold text-foreground">Biznesni tahrirlash</h2>
          <p class="text-xs text-muted-foreground mt-0.5">{{ business.name }} · ID: {{ business.business_code }}</p>
        </div>
        <button @click="emit('close')" class="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent">
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex items-center gap-2 px-6 py-4 flex-wrap">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="tab = t.key"
          :class="[
            'rounded-lg px-3 py-1.5 text-sm transition-colors',
            tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
          ]"
        >
          {{ t.label }}
        </button>
      </div>

      <p class="px-6 text-xs text-muted-foreground mb-2">* belgisi bilan belgilangan maydonlar to'ldirilishi shart</p>

      <div class="flex-1 px-6 py-2 space-y-4">
        <template v-if="tab === 'asosiy'">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="ed-label">Biznes nomi *</label><input v-model="form.name" class="ed-input" /></div>
            <div><label class="ed-label">Mas'ul shaxs FIO *</label><input v-model="form.owner" class="ed-input" /></div>
            <div>
              <label class="ed-label">Kategoriya *</label>
              <select v-model="form.category" class="ed-input">
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="ed-label">Biznes turi *</label>
              <select v-model="form.business_type" class="ed-input">
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div><label class="ed-label">Biznes haqida qisqacha</label><textarea v-model="form.description" class="ed-input min-h-24 resize-none" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="ed-label">Login *</label><input v-model="form.login" class="ed-input" /></div>
            <div><label class="ed-label">Parol *</label><input v-model="form.password" class="ed-input" /></div>
          </div>
        </template>

        <template v-if="tab === 'kontakt'">
          <div><label class="ed-label">Telefon *</label><input v-model="form.phone" class="ed-input" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="ed-label">Instagram</label><input v-model="form.instagram" class="ed-input" /></div>
            <div><label class="ed-label">Telegram</label><input v-model="form.telegram" class="ed-input" /></div>
            <div><label class="ed-label">Email</label><input v-model="form.email" class="ed-input" /></div>
            <div><label class="ed-label">Veb-sayt</label><input v-model="form.website" class="ed-input" /></div>
          </div>
        </template>

        <template v-if="tab === 'joylashuv'">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="ed-label">Viloyat *</label>
              <select v-model="form.region" class="ed-input">
                <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div><label class="ed-label">Shahar / Tuman *</label><input v-model="form.district" class="ed-input" /></div>
          </div>
          <div><label class="ed-label">To'liq manzil *</label><input v-model="form.address" class="ed-input" /></div>
        </template>

        <template v-if="tab === 'chegirma'">
          <div>
            <label class="ed-label">Chegirma foizi *</label>
            <input :value="form.discount_percent + '%'" readonly class="ed-input" />
            <input v-model.number="form.discount_percent" type="range" min="1" max="20" class="w-full accent-primary mt-2" />
          </div>
          <div><label class="ed-label">Min. xarid summasi (so'm)</label><input v-model.number="form.min_purchase" type="number" class="ed-input" /></div>
        </template>
      </div>

      <div class="flex items-center justify-between px-6 py-4 border-t border-border sticky bottom-0 bg-popover">
        <button @click="emit('close')" class="rounded-xl bg-muted hover:bg-accent px-5 py-2.5 text-sm font-medium text-foreground transition-colors">
          Bekor qilish
        </button>
        <button @click="save" :disabled="saving" class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70">
          {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ed-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
  margin-bottom: 0.375rem;
}
.ed-input {
  width: 100%;
  height: 2.5rem;
  border-radius: 0.625rem;
  background: var(--color-muted);
  border: 1px solid var(--color-border);
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-foreground);
}
.ed-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-ring);
}
textarea.ed-input {
  height: auto;
  padding: 0.5rem 0.75rem;
}
</style>
