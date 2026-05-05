import { describe, it, expect } from 'vitest'
import {
  toISODate,
  formatDisplayDate,
  formatDisplayTime,
  weekStart,
  weekEnd,
  monthStart,
  monthEnd,
} from '../lib/dateHelpers'

describe('toISODate', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 4, 5))).toBe('2026-05-05')
  })
})

describe('formatDisplayDate', () => {
  it('returns readable date', () => {
    expect(formatDisplayDate('2026-05-05')).toBe('5 May 2026')
  })
})

describe('formatDisplayTime', () => {
  it('returns HH:MM', () => {
    expect(formatDisplayTime('08:00')).toBe('08:00')
  })
})

describe('week boundaries', () => {
  it('weekStart returns Monday', () => {
    // 2026-05-05 is a Tuesday
    expect(weekStart('2026-05-05')).toBe('2026-05-04')
  })
  it('weekEnd returns Sunday', () => {
    expect(weekEnd('2026-05-05')).toBe('2026-05-10')
  })
})

describe('month boundaries', () => {
  it('monthStart returns first of month', () => {
    expect(monthStart('2026-05-15')).toBe('2026-05-01')
  })
  it('monthEnd returns last of month', () => {
    expect(monthEnd('2026-05-15')).toBe('2026-05-31')
  })
})
