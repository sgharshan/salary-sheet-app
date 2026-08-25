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
    this.version(2).stores({
      shifts:  'id, date, createdAt',
      payouts: 'id, date, createdAt',
      settings: 'id',
    }).upgrade(async tx => {
      await tx.table('settings').toCollection().modify(s => {
        if (s.stores === undefined) s.stores = []
        if (s.defaultStoreId === undefined) s.defaultStoreId = null
      })
      await tx.table('shifts').toCollection().modify(s => {
        if (s.storeName === undefined) s.storeName = ''
      })
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
      stores: [],
      defaultStoreId: null,
      lastSyncedAt: null,
      googleAccessToken: null,
      googleTokenExpiry: null,
    })
  }
}
