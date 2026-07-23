<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  title: string
  loading: boolean
  fields: { label: string; value: string }[]
}>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <div
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    @click="emit('close')"
  >
    <div
      @click.stop
      class="w-full max-w-md rounded-2xl bg-popover border border-border p-6"
      style="box-shadow: var(--shadow-glow)"
    >
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-foreground font-semibold text-lg">{{ title }}</h3>
        <button
          @click="emit('close')"
          class="h-8 w-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
      <div v-else class="space-y-3">
        <div
          v-for="f in fields"
          :key="f.label"
          class="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
        >
          <span class="text-xs text-muted-foreground">{{ f.label }}</span>
          <span class="text-sm text-foreground font-medium">{{ f.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
