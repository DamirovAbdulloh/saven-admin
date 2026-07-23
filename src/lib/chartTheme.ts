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

export const GRID_COLOR = 'oklch(0.28 0.006 260)'
export const AXIS_COLOR = 'oklch(0.68 0.01 260)'
export const PRIMARY = 'oklch(0.87 0.22 135)'
export const TOOLTIP_BG = 'oklch(0.22 0.008 260)'
export const TOOLTIP_BORDER = 'oklch(0.28 0.006 260)'
export const TOOLTIP_TEXT = 'oklch(0.98 0.002 260)'
export const PIE_COLORS = [
  'oklch(0.87 0.22 135)',
  'oklch(0.7 0.18 145)',
  'oklch(0.55 0.14 155)',
  'oklch(0.4 0.08 160)',
]

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
