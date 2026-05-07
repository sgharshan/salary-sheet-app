import type { Shift, Payout } from '../types'
import { calcHoursWorked, calcShiftPay, calcOutstanding } from './calculations'

export interface JsonReport {
  reportMeta: {
    generatedAt: string
    dateRange: { from: string; to: string }
    currency: string
    hourlyRate: number
  }
  summary: {
    totalShifts: number
    totalHours: number
    totalEarned: number
    totalPayouts: number
    outstanding: number
  }
  shifts: Shift[]
  payouts: Payout[]
}

export function buildJsonReport(
  shifts: Shift[],
  payouts: Payout[],
  from: string,
  to: string,
  currency: string,
  hourlyRate: number,
): JsonReport {
  const totalHours = shifts.reduce((s, sh) => s + calcHoursWorked(sh.startTime, sh.endTime), 0)
  const totalEarned = shifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)
  const totalPayouts = payouts.reduce((s, p) => s + p.amount, 0)

  return {
    reportMeta: { generatedAt: new Date().toISOString(), dateRange: { from, to }, currency, hourlyRate },
    summary: {
      totalShifts: shifts.length,
      totalHours: Math.round(totalHours * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPayouts: Math.round(totalPayouts * 100) / 100,
      outstanding: calcOutstanding(totalEarned, totalPayouts),
    },
    shifts,
    payouts,
  }
}

export function downloadJson(report: JsonReport, filename: string): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
