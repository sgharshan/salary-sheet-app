import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Settings } from '../types'
import { today } from '../lib/dateHelpers'

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get(1))
  return settings ?? null
}

export async function updateHourlyRate(newRate: number): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) return
  const history = [
    ...s.rateHistory,
    { rate: s.currentHourlyRate, effectiveFrom: s.rateHistory.length === 0 ? '2000-01-01' : today() },
  ]
  await db.settings.update(1, {
    currentHourlyRate: newRate,
    rateHistory: history,
  })
}

export async function getRateForDate(date: string): Promise<number> {
  const s = await db.settings.get(1)
  if (!s) return 0
  // Find the most recent rate entry effective on or before the given date
  const applicable = [...s.rateHistory]
    .filter(r => r.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  if (applicable.length > 0) return applicable[0].rate
  return s.currentHourlyRate
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.settings.update(1, patch)
}
