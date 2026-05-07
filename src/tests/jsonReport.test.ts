import { describe, it, expect } from 'vitest'
import { buildJsonReport } from '../lib/jsonReport'
import type { Shift, Payout } from '../types'

const shift: Shift = {
  id: '1', date: '2026-04-28', startTime: '08:00', endTime: '16:00',
  label: '', notes: '', hourlyRateSnapshot: 12,
  createdAt: '', updatedAt: '',
}
const payout: Payout = {
  id: '2', date: '2026-05-02', amount: 300, notes: 'Weekly pay',
  createdAt: '', updatedAt: '',
}

describe('buildJsonReport', () => {
  it('calculates summary correctly', () => {
    const r = buildJsonReport([shift], [payout], '2026-04-28', '2026-05-05', 'GBP', 12)
    expect(r.summary.totalShifts).toBe(1)
    expect(r.summary.totalHours).toBe(8)
    expect(r.summary.totalEarned).toBe(96)
    expect(r.summary.totalPayouts).toBe(300)
    expect(r.summary.outstanding).toBe(0)
  })
})
