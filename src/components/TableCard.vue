<script setup lang="ts">
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'

interface Row {
  name: string
  phone?: string
  status: string
  date: string
}

const props = defineProps<{
  title: string
  rows: Row[]
  showPhone: boolean
  to: string
}>()

const router = useRouter()
function goToFull() {
  router.push(props.to)
}
</script>

<template>
  <div class="rounded-2xl bg-card border border-border p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-foreground font-semibold">{{ title }}</h3>
      <button
        @click="goToFull"
        class="rounded-full bg-muted hover:bg-accent text-xs px-3 py-1.5 text-foreground transition-colors"
      >
        Barchasini ko'rish ›
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-muted-foreground text-xs">
            <th class="text-left font-normal py-2">Ism</th>
            <th v-if="showPhone" class="text-left font-normal py-2">Telefon</th>
            <th class="text-left font-normal py-2">Status</th>
            <th class="text-left font-normal py-2">A'zo bo'lgan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="border-t border-border/60">
            <td class="py-3 text-foreground">{{ r.name }}</td>
            <td v-if="showPhone" class="py-3 text-muted-foreground">{{ r.phone }}</td>
            <td class="py-3"><StatusBadge :status="r.status" /></td>
            <td class="py-3 text-muted-foreground">{{ r.date }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
