<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  /** Optional color override: green | red | blue | orange | gray */
  color?: string
  /**
   * Dizaynda "Arizalar" ekranidagi statuslar alohida (ochroq) tusda —
   * shu ekranda `variant="application"` beriladi.
   */
  variant?: 'default' | 'application'
}>()

const COLOR_BY_STATUS: Record<string, string> = {
  // Membership
  Premium: 'green',
  "Muddati o'tgan": 'red',
  Yangi: 'blue',
  'Free Trial': 'orange',
  Bloklangan: 'gray',
  // Activity
  Faol: 'green',
  Nofaol: 'gray',
  "O'tgan": 'red',
  // Business
  Tasdiqlangan: 'green',
  Kutilmoqda: 'orange',
  Takroriy: 'blue',
  'Rad etilgan': 'red',
  // Applications
  "Ko'rib chiqilmoqda": 'orange',
  "Bog'lanildi": 'blue',
  'Biznes yaratildi': 'teal',
  'Rad etildi': 'red',
  // Payments / transactions
  Muvaffaqiyatli: 'green',
  Qaytarilgan: 'red',
  'Bekor qilingan': 'red',
}

// Dizayn UI Kit'idagi aniq ranglar (fon / matn) — shaffoflik yo'q.
const CLASSES: Record<string, string> = {
  green: 'bg-[#053321] text-[#17b26a]',
  red: 'bg-[#55160c] text-[#f04438]',
  blue: 'bg-[#102a56] text-[#2e90fa]',
  orange: 'bg-[#4e1d09] text-[#f79009]',
  teal: 'bg-[#042f2a] text-[#2dd4bf]',
  gray: 'bg-[#292929] text-[#737373]',
}

// "Arizalar" ekranidagi statuslar — dizaynda ochroq va boshqacha tusda.
const APPLICATION_CLASSES: Record<string, string> = {
  Yangi: 'bg-[#083400] text-[#89ea5c]',
  "Ko'rib chiqilmoqda": 'bg-[#3a2c05] text-[#f7c848]',
  "Bog'lanildi": 'bg-[#052c3a] text-[#67c5f0]',
  'Biznes yaratildi': 'bg-[#042f2a] text-[#2dd4bf]',
  'Rad etildi': 'bg-[#3a0d09] text-[#f97066]',
}

const cls = computed(() => {
  if (props.variant === 'application' && !props.color) {
    const found = APPLICATION_CLASSES[props.status]
    if (found) return found
  }
  return CLASSES[props.color ?? COLOR_BY_STATUS[props.status] ?? 'gray']
})
</script>

<template>
  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', cls]">
    {{ status }}
  </span>
</template>
