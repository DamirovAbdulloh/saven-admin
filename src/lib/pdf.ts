import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '@/assets/logo-savin.svg'

/**
 * Branded PDF export used by every "Yuklash" button.
 * Renders the Savin logo header, a themed data table and page footers,
 * then saves the file straight to the user's computer.
 */

const GREEN: [number, number, number] = [149, 240, 109] // #95F06D — dizayndagi asosiy yashil
const DARK: [number, number, number] = [16, 19, 17]
const ROW_ALT: [number, number, number] = [243, 248, 240]
const TEXT: [number, number, number] = [34, 40, 36]
const MUTED: [number, number, number] = [120, 130, 122]

let logoCache: Promise<{ data: string; ratio: number }> | null = null

function loadLogo(): Promise<{ data: string; ratio: number }> {
  if (!logoCache) {
    logoCache = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const w = 600
        const h = Math.round((img.height / img.width) * w)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve({ data: canvas.toDataURL('image/png'), ratio: h / w })
      }
      img.onerror = reject
      img.src = logoUrl
    })
  }
  return logoCache
}

export interface TablePdfOptions {
  filename: string
  title: string
  subtitle?: string
  columns: string[]
  rows: (string | number)[][]
  total?: number
}

export async function downloadTablePdf(opts: TablePdfOptions) {
  const landscape = opts.columns.length >= 6
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40

  let logo: { data: string; ratio: number } | null = null
  try {
    logo = await loadLogo()
  } catch {
    /* header falls back to text if the logo can't be rasterized */
  }

  const now = new Date()
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const drawHeader = () => {
    // Dark brand band
    doc.setFillColor(...DARK)
    doc.roundedRect(margin, 28, pageW - margin * 2, 64, 10, 10, 'F')

    if (logo) {
      const logoW = 110
      const logoH = logoW * logo.ratio
      doc.addImage(logo.data, 'PNG', margin + 20, 28 + (64 - logoH) / 2, logoW, logoH)
    } else {
      doc.setTextColor(...GREEN)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('savin', margin + 20, 68)
    }

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(opts.title, pageW - margin - 20, 54, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GREEN)
    const sub = opts.subtitle ?? `Hisobot sanasi: ${dateStr}`
    doc.text(sub, pageW - margin - 20, 72, { align: 'right' })
  }

  const drawFooter = (page: number, pages: number) => {
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(1.2)
    doc.line(margin, pageH - 42, pageW - margin, pageH - 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(`Savin Admin paneli · ${dateStr}`, margin, pageH - 28)
    doc.text(`Sahifa ${page} / ${pages}`, pageW - margin, pageH - 28, { align: 'right' })
  }

  const summaryLine =
    opts.total != null && opts.total > opts.rows.length
      ? `Jami: ${opts.total.toLocaleString()} ta yozuv · Hisobotda birinchi ${opts.rows.length.toLocaleString()} tasi ko'rsatilgan`
      : `Jami: ${opts.rows.length.toLocaleString()} ta yozuv`

  autoTable(doc, {
    head: [opts.columns],
    body: opts.rows.map((r) => r.map((c) => String(c))),
    startY: 118,
    margin: { left: margin, right: margin, top: 110, bottom: 60 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: TEXT,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      lineColor: [225, 232, 226],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: GREEN,
      textColor: DARK,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    didDrawPage: () => {
      drawHeader()
      // Summary line under the header on the first page only
      if (doc.getNumberOfPages() === 1) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...MUTED)
        doc.text(summaryLine, margin, 108)
      }
    },
  })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    drawFooter(i, pages)
  }

  doc.save(opts.filename)
}
