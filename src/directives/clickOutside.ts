import type { Directive, DirectiveBinding } from 'vue'

/**
 * v-click-outside — element tashqarisiga bosilganda chaqiriladi.
 *
 * Ochiladigan menyular (filtr, kalendar, tanlash ro'yxati) uchun: menyuni
 * yopish uchun tugmani qayta bosish shart emas, ekranning boshqa joyiga
 * bosish kifoya.
 *
 * Direktiva menyuni ochadigan TUGMA ham ichida bo'lgan o'ramga qo'yiladi —
 * shunda tugmani bosish "tashqari" deb hisoblanmaydi va menyu darhol
 * qayta ochilib-yopilib ketmaydi.
 *
 *   <div class="relative" v-click-outside="() => (filterOpen = false)">
 */

type OutsideEl = HTMLElement & { __clickOutside__?: (e: Event) => void }

export const vClickOutside: Directive = {
  mounted(el: OutsideEl, binding: DirectiveBinding) {
    el.__clickOutside__ = (e: Event) => {
      const target = e.target as Node | null
      // Element DOM'dan olib tashlangan bo'lsa (masalan modal yopilgan)
      // "tashqari" deb hisoblamaymiz — aks holda keraksiz chaqiruv bo'ladi.
      if (!target || !document.contains(target)) return
      if (!el.contains(target)) binding.value?.(e)
    }
    document.addEventListener('click', el.__clickOutside__)
    // Mobil qurilmalarda ham ishlashi uchun
    document.addEventListener('touchstart', el.__clickOutside__, { passive: true })
  },
  unmounted(el: OutsideEl) {
    if (!el.__clickOutside__) return
    document.removeEventListener('click', el.__clickOutside__)
    document.removeEventListener('touchstart', el.__clickOutside__)
    delete el.__clickOutside__
  },
}

export default vClickOutside
