import { describe, it, expect } from 'vitest'
import { shiftIdsNeedingBackfill } from '../hooks/useSettings'
import type { Shift } from '../types'

function makeShift(id: string, storeName: string): Shift {
  return {
    id, date: '2026-08-01', startTime: '08:00', endTime: '16:00',
    label: '', notes: '', storeName, hourlyRateSnapshot: 12,
    createdAt: '', updatedAt: '',
  }
}

describe('shiftIdsNeedingBackfill', () => {
  it('selects only shifts with an empty storeName', () => {
    const shifts = [makeShift('1', ''), makeShift('2', 'Riverside Cafe'), makeShift('3', '')]
    expect(shiftIdsNeedingBackfill(shifts)).toEqual(['1', '3'])
  })

  it('returns an empty array when every shift already has a store', () => {
    const shifts = [makeShift('1', 'Riverside Cafe')]
    expect(shiftIdsNeedingBackfill(shifts)).toEqual([])
  })

  it('returns an empty array for no shifts', () => {
    expect(shiftIdsNeedingBackfill([])).toEqual([])
  })
})
