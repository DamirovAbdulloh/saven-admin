<script setup lang="ts">
defineProps<{
  label: string
  selected: boolean
  /** selected accent: green (default) or red */
  tone?: 'green' | 'red'
}>()

const emit = defineEmits<{ (e: 'select'): void }>()
</script>

<template>
  <button
    type="button"
    @click="emit('select')"
    :class="[
      'w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-left transition-colors',
      selected
        ? tone === 'red'
          ? 'border-destructive/60 bg-destructive/10 text-destructive'
          : 'border-primary/60 bg-primary/10 text-primary'
        : 'border-transparent bg-muted/70 text-foreground hover:bg-muted',
    ]"
  >
    <span
      :class="[
        'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
        selected ? (tone === 'red' ? 'border-destructive' : 'border-primary') : 'border-muted-foreground/50',
      ]"
    >
      <span
        v-if="selected"
        :class="['h-2 w-2 rounded-full', tone === 'red' ? 'bg-destructive' : 'bg-primary']"
      />
    </span>
    <span class="flex-1">{{ label }}</span>
    <slot />
  </button>
</template>
