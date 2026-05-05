import Dexie, { type Table } from 'dexie'
import type { Shift, Payout, Settings } from '../types'

class ShiftLogDB extends Dexie {
  shifts!: Table<Shift, string>
  payouts!: Table<Payout, string>
  settings!: Table<Settings, number>

  constructor() {
    super('ShiftLogDB')
    this.version(1).stores({
      shifts:  'id, date, createdAt',
      payouts: 'id, date, createdAt',
      settings: 'id',
    })
  }
}

export const db = new ShiftLogDB()

export async function initSettings(): Promise<void> {
  const existing = await db.settings.get(1)
  if (!existing) {
    await db.settings.add({
      id: 1,
      currency: 'GBP',
      currencySymbol: '£',
      currentHourlyRate: 0,
      rateHistory: [],
      lastSyncedAt: null,
      googleAccessToken: null,
      googleTokenExpiry: null,
    })
  }
}
