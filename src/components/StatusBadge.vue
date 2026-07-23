<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  /** Optional color override: green | red | blue | orange | teal | gray */
  color?: string
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

const CLASSES: Record<string, string> = {
  green: 'bg-[oklch(0.35_0.14_145)]/60 text-[oklch(0.9_0.2_140)]',
  red: 'bg-[oklch(0.4_0.18_25)]/60 text-[oklch(0.9_0.13_25)]',
  blue: 'bg-[oklch(0.4_0.18_250)]/60 text-[oklch(0.92_0.06_250)]',
  orange: 'bg-[oklch(0.45_0.14_55)]/60 text-[oklch(0.9_0.14_65)]',
  teal: 'bg-[oklch(0.4_0.1_190)]/60 text-[oklch(0.9_0.11_190)]',
  gray: 'bg-muted text-muted-foreground',
}

const cls = computed(() => CLASSES[props.color ?? COLOR_BY_STATUS[props.status] ?? 'gray'])
</script>

<template>
  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', cls]">
    {{ status }}
  </span>
</template>
