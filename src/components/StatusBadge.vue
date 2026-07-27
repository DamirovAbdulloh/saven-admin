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

// Text colors are the saturated Untitled UI values used in the Figma design
// (green #17b26a, red #f04438, blue #2e90fa, orange #f79009).
const CLASSES: Record<string, string> = {
  green: 'bg-[oklch(0.35_0.1_156)]/60 text-[oklch(0.673_0.16_156)]',
  red: 'bg-[oklch(0.4_0.16_28.5)]/60 text-[oklch(0.637_0.21_28.5)]',
  blue: 'bg-[oklch(0.4_0.16_254)]/60 text-[oklch(0.652_0.181_254)]',
  orange: 'bg-[oklch(0.45_0.15_62)]/60 text-[oklch(0.747_0.17_62)]',
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
