export interface RateEntry {
  rate: number
  effectiveFrom: string // ISO date 'YYYY-MM-DD'
}

export interface Store {
  id: string
  name: string
}

export interface Shift {
  id: string
  date: string         // 'YYYY-MM-DD'
  startTime: string    // 'HH:MM'
  endTime: string      // 'HH:MM'
  label: string        // '' if none
  notes: string
  storeName: string    // '' if none. Snapshot of the store's name at save time.
  hourlyRateSnapshot: number
  createdAt: string    // ISO datetime
  updatedAt: string
}

export interface Payout {
  id: string
  date: string         // 'YYYY-MM-DD'
  amount: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
  id: 1                // singleton row
  currency: string     // 'GBP'
  currencySymbol: string // '£'
  currentHourlyRate: number
  rateHistory: RateEntry[]
  stores: Store[]
  defaultStoreId: string | null
  lastSyncedAt: string | null
  googleAccessToken: string | null
  googleTokenExpiry: number | null  // Unix ms
}
