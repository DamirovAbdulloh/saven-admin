<script setup lang="ts">
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next'
import { toasts } from '@/composables/useToast'

// Exact port of sonner's `richColors` dark theme palette (verified against
// the actual sonner@2.0.7 dist/styles.css shipped in the original project).
const palette: Record<string, { bg: string; border: string; text: string }> = {
  success: { bg: 'hsl(150, 100%, 6%)', border: 'hsl(147, 100%, 12%)', text: 'hsl(150, 86%, 65%)' },
  error: { bg: 'hsl(358, 76%, 10%)', border: 'hsl(357, 89%, 16%)', text: 'hsl(358, 100%, 81%)' },
  info: { bg: 'hsl(215, 100%, 6%)', border: 'hsl(223, 43%, 17%)', text: 'hsl(216, 87%, 65%)' },
}

const icons: Record<string, any> = { success: CheckCircle2, error: XCircle, info: Info }
</script>

<template>
  <!-- position="top-center", matching <Toaster richColors position="top-center" /> -->
  <div class="fixed top-0 left-1/2 -translate-x-1/2 z-[999999999] flex flex-col gap-[14px] items-center pointer-events-none" style="padding-top: 32px">
    <transition-group name="sonner-toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-[6px] w-[356px]"
        :style="{
          background: palette[t.kind].bg,
          border: `1px solid ${palette[t.kind].border}`,
          color: palette[t.kind].text,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }"
      >
        <component :is="icons[t.kind]" class="h-4 w-4 shrink-0" style="margin-left: -3px; margin-right: 4px" />
        <span>{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
/* sonner's actual enter/exit: transition: transform 400ms, opacity 400ms (default browser "ease") */
.sonner-toast-enter-active,
.sonner-toast-leave-active {
  transition:
    transform 400ms ease,
    opacity 400ms ease;
}
.sonner-toast-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.sonner-toast-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
