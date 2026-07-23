<script setup lang="ts">
import { X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    /** icon circle color: red | green | none */
    tone?: 'red' | 'green' | 'none'
    title?: string
    subtitle?: string
    closable?: boolean
    maxWidth?: string
  }>(),
  { tone: 'none', closable: true, maxWidth: 'max-w-md' },
)

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    @click.self="closable && emit('close')"
  >
    <div
      :class="['relative w-full rounded-3xl bg-popover border border-border p-6 md:p-8 max-h-[90vh] overflow-y-auto', maxWidth]"
      style="box-shadow: 0 24px 80px oklch(0 0 0 / 0.55)"
    >
      <button
        v-if="closable"
        @click="emit('close')"
        class="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
      >
        <X class="h-4 w-4" />
      </button>

      <div v-if="tone !== 'none'" class="flex justify-center mb-5">
        <div
          :class="[
            'w-14 h-14 rounded-full flex items-center justify-center',
            tone === 'red' ? 'bg-destructive' : 'bg-[oklch(0.55_0.15_155)]',
          ]"
        >
          <slot name="icon" />
        </div>
      </div>

      <h2 v-if="title" class="text-xl md:text-2xl font-bold text-foreground text-center mb-1">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm text-muted-foreground text-center mb-5 whitespace-pre-line">{{ subtitle }}</p>

      <slot />

      <div v-if="$slots.actions" class="flex items-center justify-center gap-3 mt-6">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
