import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '../db/database'
import type { Payout } from '../types'

export function usePayouts(fromDate?: string, toDate?: string) {
  const payouts = useLiveQuery(async () => {
    if (fromDate && toDate) {
      return db.payouts.where('date').between(fromDate, toDate, true, true).reverse().toArray()
    }
    return db.payouts.orderBy('date').reverse().toArray()
  }, [fromDate, toDate])

  return { payouts: payouts ?? [] }
}

export async function addPayout(
  data: Omit<Payout, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const now = new Date().toISOString()
  await db.payouts.add({ ...data, id: uuid(), createdAt: now, updatedAt: now })
}

export async function deletePayout(id: string): Promise<void> {
  await db.payouts.delete(id)
}

export async function getAllPayouts(): Promise<Payout[]> {
  return db.payouts.orderBy('date').toArray()
}

export function calcPayoutsTotal(payouts: Payout[]): number {
  return payouts.reduce((sum, p) => sum + p.amount, 0)
}
