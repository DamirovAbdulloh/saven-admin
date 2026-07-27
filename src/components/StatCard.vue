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

// Design: list-page stat cards carry a colored border + soft inner glow.
// Ranglar dizayndagi status ranglari bilan bir xil (#17b26a / #f04438 /
// #2e90fa / #f79009).
const ring = computed(() => {
  switch (props.variant) {
    case 'premium':
      return 'border-[#17b26a]/70 shadow-[inset_0_0_28px_rgb(23_178_106_/_0.14)]'
    case 'overdue':
      return 'border-[#f04438]/70 shadow-[inset_0_0_28px_rgb(240_68_56_/_0.14)]'
    case 'new':
      return 'border-[#2e90fa]/70 shadow-[inset_0_0_28px_rgb(46_144_250_/_0.14)]'
    case 'pending':
      return 'border-[#f79009]/70 shadow-[inset_0_0_28px_rgb(247_144_9_/_0.14)]'
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
