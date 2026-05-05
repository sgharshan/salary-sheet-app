import { describe, it, expect } from 'vitest'
import {
  calcHoursWorked,
  calcShiftPay,
  calcOutstanding,
} from '../lib/calculations'

describe('calcHoursWorked', () => {
  it('returns decimal hours for same-day shift', () => {
    expect(calcHoursWorked('08:00', '16:00')).toBe(8)
  })
  it('returns decimal hours for partial hour shift', () => {
    expect(calcHoursWorked('08:00', '12:30')).toBe(4.5)
  })
  it('handles overnight shift (end < start)', () => {
    expect(calcHoursWorked('22:00', '06:00')).toBe(8)
  })
})

describe('calcShiftPay', () => {
  it('multiplies hours by rate', () => {
    expect(calcShiftPay('08:00', '16:00', 12)).toBe(96)
  })
  it('rounds to 2 decimal places', () => {
    expect(calcShiftPay('08:00', '09:20', 12)).toBe(16)
  })
})

describe('calcOutstanding', () => {
  it('returns earned minus payouts', () => {
    expect(calcOutstanding(456, 300)).toBe(156)
  })
  it('returns 0 when fully paid', () => {
    expect(calcOutstanding(300, 300)).toBe(0)
  })
  it('returns 0 when overpaid (never negative outstanding)', () => {
    expect(calcOutstanding(100, 200)).toBe(0)
  })
})
