<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * Dual-month calendar range picker matching the design mock:
 * two months side by side, green range highlight, footer with the
 * selected range and Orqaga / Qo'llash buttons.
 */

const props = defineProps<{ start?: string; end?: string }>()
const emit = defineEmits<{
  (e: 'apply', start: string, end: string): void
  (e: 'cancel'): void
  (e: 'clear'): void
}>()

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const WEEKDAYS = ['DU', 'SE', 'CH', 'PA', 'JU', 'SH', 'YA']

function parseISO(s?: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const selStart = ref<Date | null>(parseISO(props.start))
const selEnd = ref<Date | null>(parseISO(props.end))

const today = new Date()
const anchor = ref(
  selStart.value
    ? new Date(selStart.value.getFullYear(), selStart.value.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth() - 1, 1),
)
const rightAnchor = computed(() => new Date(anchor.value.getFullYear(), anchor.value.getMonth() + 1, 1))

interface Cell {
  date: Date
  other: boolean
}
function monthCells(y: number, m: number): Cell[] {
  const first = new Date(y, m, 1)
  const startIdx = (first.getDay() + 6) % 7 // Monday = 0
  const cells: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m, 1 - startIdx + i)
    cells.push({ date: d, other: d.getMonth() !== m })
  }
  return cells
}
const leftCells = computed(() => monthCells(anchor.value.getFullYear(), anchor.value.getMonth()))
const rightCells = computed(() => monthCells(rightAnchor.value.getFullYear(), rightAnchor.value.getMonth()))

function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isEdge(d: Date) {
  return sameDay(d, selStart.value) || sameDay(d, selEnd.value)
}
function inRange(d: Date) {
  return !!selStart.value && !!selEnd.value && d > selStart.value && d < selEnd.value
}

function pick(d: Date) {
  if (!selStart.value || (selStart.value && selEnd.value)) {
    selStart.value = d
    selEnd.value = null
  } else if (d < selStart.value) {
    selEnd.value = selStart.value
    selStart.value = d
  } else {
    selEnd.value = d
  }
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const rangeText = computed(() => {
  if (!selStart.value) return 'Tanlanmagan'
  const f = (d: Date) => `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
  return selEnd.value ? `${f(selStart.value)} – ${f(selEnd.value)}` : f(selStart.value)
})

function apply() {
  if (selStart.value && selEnd.value) emit('apply', iso(selStart.value), iso(selEnd.value))
}
function clearAll() {
  selStart.value = null
  selEnd.value = null
  emit('clear')
}
</script>

<template>
  <div class="rounded-2xl bg-popover border border-border shadow-xl p-4 w-[540px] max-w-[92vw]">
    <div class="flex items-center justify-end mb-2">
      <button @click="clearAll" class="text-xs text-muted-foreground hover:text-foreground">Filtrni tozalash</button>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <!-- Left month -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <button
            @click="anchor = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)"
            class="h-7 w-7 rounded-lg bg-muted hover:bg-accent flex items-center justify-center"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="text-sm font-medium text-foreground">{{ MONTHS[anchor.getMonth()] }} {{ anchor.getFullYear() }}</span>
          <span class="w-7" />
        </div>
        <div class="grid grid-cols-7 gap-y-1 text-center">
          <span v-for="w in WEEKDAYS" :key="w" class="text-[10px] text-muted-foreground py-1">{{ w }}</span>
          <button
            v-for="(c, i) in leftCells"
            :key="i"
            @click="pick(c.date)"
            :class="[
              'h-8 w-8 mx-auto rounded-lg text-xs flex items-center justify-center transition-colors',
              c.other ? 'text-muted-foreground/40' : 'text-foreground',
              isEdge(c.date) ? '!bg-primary !text-primary-foreground font-semibold' : inRange(c.date) ? 'bg-primary/20 text-primary' : 'hover:bg-muted',
            ]"
          >
            {{ c.date.getDate() }}
          </button>
        </div>
      </div>

      <!-- Right month -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="w-7" />
          <span class="text-sm font-medium text-foreground">{{ MONTHS[rightAnchor.getMonth()] }} {{ rightAnchor.getFullYear() }}</span>
          <button
            @click="anchor = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)"
            class="h-7 w-7 rounded-lg bg-muted hover:bg-accent flex items-center justify-center"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
        <div class="grid grid-cols-7 gap-y-1 text-center">
          <span v-for="w in WEEKDAYS" :key="w" class="text-[10px] text-muted-foreground py-1">{{ w }}</span>
          <button
            v-for="(c, i) in rightCells"
            :key="i"
            @click="pick(c.date)"
            :class="[
              'h-8 w-8 mx-auto rounded-lg text-xs flex items-center justify-center transition-colors',
              c.other ? 'text-muted-foreground/40' : 'text-foreground',
              isEdge(c.date) ? '!bg-primary !text-primary-foreground font-semibold' : inRange(c.date) ? 'bg-primary/20 text-primary' : 'hover:bg-muted',
            ]"
          >
            {{ c.date.getDate() }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-border mt-4 pt-3">
      <span class="text-xs text-muted-foreground">Sana oralig'i: <span class="text-foreground">{{ rangeText }}</span></span>
      <div class="flex items-center gap-2">
        <button @click="emit('cancel')" class="rounded-lg bg-muted hover:bg-accent px-4 py-2 text-xs font-medium text-foreground transition-colors">
          Orqaga
        </button>
        <button
          @click="apply"
          :disabled="!selStart || !selEnd"
          class="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          Qo'llash
        </button>
      </div>
    </div>
  </div>
</template>
