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
