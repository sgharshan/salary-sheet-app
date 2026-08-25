import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '../db/database'
import type { Settings, Shift } from '../types'
import { today } from '../lib/dateHelpers'

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get(1))
  return settings ?? null
}

export async function updateHourlyRate(newRate: number): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) return
  // Only archive the old rate if it was a real non-zero rate (skip archiving the initial 0 default)
  const history =
    s.currentHourlyRate > 0
      ? [...s.rateHistory, { rate: s.currentHourlyRate, effectiveFrom: today() }]
      : s.rateHistory
  await db.settings.update(1, { currentHourlyRate: newRate, rateHistory: history })
}

export async function getRateForDate(date: string): Promise<number> {
  const s = await db.settings.get(1)
  if (!s) return 0
  const sorted = [...s.rateHistory].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
  const applicable = sorted.filter(r => r.effectiveFrom <= date)
  if (applicable.length > 0) return applicable[applicable.length - 1].rate
  // Date is before all history entries — use oldest known rate, or current as last resort
  return sorted.length > 0 ? sorted[0].rate : s.currentHourlyRate
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.settings.update(1, patch)
}

export async function addStore(name: string): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) return
  await db.settings.update(1, { stores: [...s.stores, { id: uuid(), name }] })
}

export async function renameStore(id: string, name: string): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) return
  const stores = s.stores.map(store => store.id === id ? { ...store, name } : store)
  await db.settings.update(1, { stores })
}

export async function deleteStore(id: string): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) return
  const stores = s.stores.filter(store => store.id !== id)
  const defaultStoreId = s.defaultStoreId === id ? null : s.defaultStoreId
  await db.settings.update(1, { stores, defaultStoreId })
}

// Exported for unit testing: which shifts should be stamped with the store
// name when a default store is (re)assigned. Only shifts that have never
// had an explicit store (empty storeName) are eligible — shifts that
// already carry a snapshot name are never touched.
export function shiftIdsNeedingBackfill(shifts: Shift[]): string[] {
  return shifts.filter(s => !s.storeName).map(s => s.id)
}

export async function setDefaultStore(id: string): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) return
  const store = s.stores.find(st => st.id === id)
  if (!store) return
  await db.settings.update(1, { defaultStoreId: id })

  const allShifts = await db.shifts.toArray()
  const idsToBackfill = shiftIdsNeedingBackfill(allShifts)
  await Promise.all(idsToBackfill.map(shiftId => db.shifts.update(shiftId, { storeName: store.name })))
}
