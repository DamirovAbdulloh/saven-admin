<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  count: number
  page: number
  pageSize: number
}>()

const emit = defineEmits<{ (e: 'update:page', page: number): void }>()

function totalPages() {
  return Math.max(1, Math.ceil(props.count / props.pageSize))
}
function prev() {
  if (props.page > 1) emit('update:page', props.page - 1)
}
function next() {
  if (props.page < totalPages()) emit('update:page', props.page + 1)
}
</script>

<template>
  <div class="flex items-center justify-between text-xs text-muted-foreground pt-4 gap-2 flex-wrap">
    <div>
      Natija
      <span class="inline-block px-2.5 py-1.5 rounded-md bg-muted text-foreground mx-1">{{ count.toLocaleString() }}</span>
      dan
    </div>
    <div class="flex items-center gap-2">
      <button
        @click="prev"
        :disabled="page <= 1"
        class="rounded-lg h-9 w-9 inline-flex items-center justify-center bg-muted hover:bg-accent disabled:opacity-40 transition-colors"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        @click="next"
        :disabled="page >= totalPages()"
        class="rounded-lg bg-primary text-primary-foreground font-medium px-4 py-2 inline-flex items-center gap-1 disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        Keyingi <ChevronRight class="h-4 w-4" />
      </button>
    </div>
    <div>
      Sahifa
      <span class="inline-block px-2.5 py-1.5 rounded-md bg-muted text-foreground mx-1">{{ page }}</span>
      dan {{ totalPages().toLocaleString() }}
    </div>
  </div>
</template>
