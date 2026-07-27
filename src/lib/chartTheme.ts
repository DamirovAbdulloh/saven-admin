import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
)

// Ranglar Figma dizaynidan aynan olingan (Admin Panel · grafiklar)
export const GRID_COLOR = '#292929'
export const AXIS_COLOR = '#737373'
export const PRIMARY = '#95f06d'
/** Ustunlarning ikkinchi (to'qroq) tusi — dizaynda juft ustunlar */
export const PRIMARY_ALT = '#5dc533'
export const TOOLTIP_BG = '#141414'
export const TOOLTIP_BORDER = '#292929'
export const TOOLTIP_TEXT = '#ffffff'
/** Donut (Click / Payme / Humo) — dizayndagi tartib */
export const PIE_COLORS = ['#2e90fa', '#75e0a7', '#fec84b', '#17b26a']

export const baseTooltip = {
  backgroundColor: TOOLTIP_BG,
  borderColor: TOOLTIP_BORDER,
  borderWidth: 1,
  titleColor: TOOLTIP_TEXT,
  bodyColor: TOOLTIP_TEXT,
  padding: 10,
  cornerRadius: 12,
  displayColors: false,
}

export function axisTicks() {
  return { color: AXIS_COLOR, font: { size: 11 } }
}

export function gridLines(vertical = false) {
  return { color: GRID_COLOR, display: vertical }
}
