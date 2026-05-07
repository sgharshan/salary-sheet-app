import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Shift, Payout } from '../types'
import { calcHoursWorked, calcShiftPay, calcOutstanding } from './calculations'
import { formatDisplayDate } from './dateHelpers'

function effectiveRate(s: Shift, currentRate: number): number {
  // If snapshot was captured before a rate was set, fall back to current rate
  return s.hourlyRateSnapshot > 0 ? s.hourlyRateSnapshot : currentRate
}

export function generatePdf(
  shifts: Shift[],
  payouts: Payout[],
  from: string,
  to: string,
  symbol: string,
  currency: string,
  currentRate: number,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  let y = margin

  // Header
  doc.setFontSize(18).setFont('helvetica', 'bold').setTextColor(0, 0, 0)
  doc.text('SHIFTLOG', margin, y)
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(120, 120, 120)
  doc.text('Work & Salary Report', margin, y + 5)
  doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(0, 0, 0)
  doc.text(`${formatDisplayDate(from)} – ${formatDisplayDate(to)}`, 196 - margin, y, { align: 'right' })
  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(120, 120, 120)
  doc.text(`Generated: ${formatDisplayDate(new Date().toISOString().slice(0, 10))}`, 196 - margin, y + 5, { align: 'right' })
  y += 14

  doc.setDrawColor(180, 180, 180).setLineWidth(0.4).line(margin, y, 196 - margin, y)
  y += 6

  // Summary — use effective rate per shift
  const totalEarned = shifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, effectiveRate(sh, currentRate)), 0)
  const totalPaid = payouts.reduce((s, p) => s + p.amount, 0)
  const outstanding = calcOutstanding(totalEarned, totalPaid)

  const colW = (196 - margin * 2) / 3
  const summaries = [
    { label: 'TOTAL EARNED', value: `${symbol}${totalEarned.toFixed(2)}`, sub: `${shifts.length} shift(s)`, highlight: false },
    { label: 'PAID OUT', value: `${symbol}${totalPaid.toFixed(2)}`, sub: `${payouts.length} payment(s)`, highlight: false },
    { label: 'OUTSTANDING', value: `${symbol}${outstanding.toFixed(2)}`, sub: 'unpaid balance', highlight: true },
  ]
  summaries.forEach((s, i) => {
    const x = margin + i * colW
    doc.setDrawColor(s.highlight ? 200 : 180, s.highlight ? 80 : 180, s.highlight ? 80 : 180)
    doc.roundedRect(x, y, colW - 2, 18, 2, 2)
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(100, 100, 100)
    doc.text(s.label, x + 3, y + 5)
    doc.setFontSize(12).setFont('helvetica', 'bold')
    doc.setTextColor(s.highlight ? 200 : 0, s.highlight ? 40 : 0, s.highlight ? 40 : 0)
    doc.text(s.value, x + 3, y + 12)
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(130, 130, 130)
    doc.text(s.sub, x + 3, y + 17)
  })
  y += 24

  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(100, 100, 100)
  doc.text(`Hourly rate: ${symbol}${currentRate.toFixed(2)}/hr  ·  Currency: ${currency}`, margin, y)
  y += 8

  // Shifts table
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Label', 'Start', 'End', 'Hours', 'Pay']],
    body: shifts.map(s => [
      formatDisplayDate(s.date),
      s.label || '—',
      s.startTime,
      s.endTime,
      `${calcHoursWorked(s.startTime, s.endTime).toFixed(2)}h`,
      `${symbol}${calcShiftPay(s.startTime, s.endTime, effectiveRate(s, currentRate)).toFixed(2)}`,
    ]),
    foot: [['', '', '', 'Total',
      `${shifts.reduce((s, sh) => s + calcHoursWorked(sh.startTime, sh.endTime), 0).toFixed(2)}h`,
      `${symbol}${totalEarned.toFixed(2)}`,
    ]],
    styles: { fontSize: 8, textColor: [30, 30, 30] },
    headStyles: { fillColor: [40, 40, 40], textColor: [220, 220, 220], fontStyle: 'bold' },
    footStyles: { fillColor: [235, 235, 235], textColor: [30, 30, 30], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: margin, right: margin },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8

  // Payouts table
  if (payouts.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Notes', 'Amount']],
      body: payouts.map(p => [formatDisplayDate(p.date), p.notes || '—', `${symbol}${p.amount.toFixed(2)}`]),
      foot: [['', 'Total Paid', `${symbol}${totalPaid.toFixed(2)}`]],
      styles: { fontSize: 8, textColor: [30, 30, 30] },
      headStyles: { fillColor: [40, 40, 40], textColor: [220, 220, 220], fontStyle: 'bold' },
      footStyles: { fillColor: [235, 235, 235], textColor: [30, 30, 30], fontStyle: 'bold' },
      bodyStyles: { textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: margin, right: margin },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Outstanding balance box
  doc.setDrawColor(200, 60, 60).setFillColor(255, 245, 245)
  doc.roundedRect(margin, y, 196 - margin * 2, 14, 2, 2, 'FD')
  doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(180, 30, 30)
  doc.text('Outstanding Balance', margin + 4, y + 9)
  doc.setFontSize(13).setTextColor(180, 30, 30)
  doc.text(`${symbol}${outstanding.toFixed(2)}`, 196 - margin - 4, y + 9, { align: 'right' })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(160, 160, 160)
    doc.text('Generated by ShiftLog', margin, 287)
    doc.text(`Page ${i} of ${pageCount}`, 196 - margin, 287, { align: 'right' })
  }

  doc.save(`ShiftLog-${from}-to-${to}.pdf`)
}
