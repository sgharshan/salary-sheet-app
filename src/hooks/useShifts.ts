import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '../db/database'
import type { Shift } from '../types'
import { calcShiftPay } from '../lib/calculations'

export function useShifts(fromDate?: string, toDate?: string) {
  const shifts = useLiveQuery(async () => {
    if (fromDate && toDate) {
      return db.shifts.where('date').between(fromDate, toDate, true, true).reverse().toArray()
    }
    return db.shifts.orderBy('date').reverse().toArray()
  }, [fromDate, toDate])

  return { shifts: shifts ?? [] }
}

export async function addShift(
  data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const now = new Date().toISOString()
  await db.shifts.add({ ...data, id: uuid(), createdAt: now, updatedAt: now })
}

export async function deleteShift(id: string): Promise<void> {
  await db.shifts.delete(id)
}

export async function getShiftsForDate(date: string): Promise<Shift[]> {
  return db.shifts.where('date').equals(date).toArray()
}

export async function getAllShifts(): Promise<Shift[]> {
  return db.shifts.orderBy('date').toArray()
}

export function calcShiftsTotal(shifts: Shift[]): number {
  return shifts.reduce(
    (sum, s) => sum + calcShiftPay(s.startTime, s.endTime, s.hourlyRateSnapshot),
    0,
  )
}
