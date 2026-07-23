import { ref } from 'vue'

const collapsed = ref(localStorage.getItem('savin_sidebar_collapsed') === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('savin_sidebar_collapsed', collapsed.value ? '1' : '0')
}

export function useSidebar() {
  return { collapsed, toggle }
}
