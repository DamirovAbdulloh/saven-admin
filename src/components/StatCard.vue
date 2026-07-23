<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    icon?: Component
    label: string
    value: string
    hint?: string
    variant?: 'default' | 'premium' | 'overdue' | 'new' | 'pending'
    to?: string
  }>(),
  { variant: 'default' },
)

// Design: list-page stat cards carry a colored border + soft inner glow
const ring = computed(() => {
  switch (props.variant) {
    case 'premium':
      return 'border-[oklch(0.5_0.14_145)]/70 shadow-[inset_0_0_28px_oklch(0.5_0.16_145_/_0.14)]'
    case 'overdue':
      return 'border-[oklch(0.5_0.2_25)]/70 shadow-[inset_0_0_28px_oklch(0.55_0.2_25_/_0.14)]'
    case 'new':
      return 'border-[oklch(0.5_0.18_250)]/70 shadow-[inset_0_0_28px_oklch(0.5_0.18_250_/_0.14)]'
    case 'pending':
      return 'border-[oklch(0.55_0.14_65)]/70 shadow-[inset_0_0_28px_oklch(0.55_0.14_65_/_0.14)]'
    default:
      return 'border-border'
  }
})
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    :class="[
      'rounded-2xl bg-card border p-4 block',
      ring,
      to ? 'cursor-pointer hover:brightness-110 transition-all' : '',
    ]"
  >
    <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
      <div v-if="icon" class="h-9 w-9 rounded-xl bg-muted/70 flex items-center justify-center">
        <component :is="icon" class="h-4 w-4 text-foreground" />
      </div>
      <span>{{ label }}</span>
    </div>
    <div class="text-2xl font-bold text-foreground leading-tight">{{ value }}</div>
    <div v-if="hint" class="text-[11px] text-muted-foreground mt-1">{{ hint }}</div>
  </component>
</template>
