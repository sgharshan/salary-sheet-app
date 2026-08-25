# Store/Shop Tracking for Shifts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users tag each shift with the shop/store it was worked at, configure a default store in Settings, and override the store per-shift via an "Advanced options" toggle on the shift form.

**Architecture:** A new `Store { id, name }` type lives on `Settings` (`stores: Store[]`, `defaultStoreId: string | null`). Each `Shift` gets a `storeName: string` field that is a **snapshot** (plain text, not a foreign key) of the store's name at save time — mirroring the existing `hourlyRateSnapshot` pattern, so deleting a store never corrupts shift history. A Dexie schema migration adds these fields with safe defaults to existing rows.

**Tech Stack:** React + TypeScript, Dexie (IndexedDB), Vitest for unit tests. No new dependencies.

---

### Task 1: Add `Store` type and extend `Settings`/`Shift` types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the `Store` interface and extend `Settings`/`Shift`**

Edit `src/types/index.ts` to match exactly:

```ts
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
```

This will produce TypeScript errors in `src/db/database.ts`, `src/components/shifts/LogShiftModal.tsx`, and `src/tests/jsonReport.test.ts` — these are fixed in later tasks.

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Store type, extend Settings and Shift with store fields"
```

---

### Task 2: Migrate the database schema

**Files:**
- Modify: `src/db/database.ts`

- [ ] **Step 1: Bump the Dexie version and add an upgrade migration**

Edit `src/db/database.ts` to match exactly:

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `database.ts`

- [ ] **Step 3: Commit**

```bash
git add src/db/database.ts
git commit -m "feat: migrate DB schema for store fields (v2, safe defaults for existing rows)"
```

---

### Task 3: Store CRUD + backfill logic in `useSettings.ts`

**Files:**
- Modify: `src/hooks/useSettings.ts`
- Test: `src/tests/useSettings.test.ts`

The backfill decision (which shifts need their `storeName` filled in when a default store is set) is extracted as a pure function so it can be unit tested without a real database.

- [ ] **Step 1: Write the failing test for the pure backfill-selection function**

Create `src/tests/useSettings.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/useSettings.test.ts`
Expected: FAIL — `shiftIdsNeedingBackfill` is not exported from `../hooks/useSettings`

- [ ] **Step 3: Implement store CRUD and backfill in `useSettings.ts`**

Edit `src/hooks/useSettings.ts` to match exactly:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/useSettings.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `useSettings.ts`

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSettings.ts src/tests/useSettings.test.ts
git commit -m "feat: add store CRUD and default-store backfill to useSettings"
```

---

### Task 4: "Stores" card in Settings page

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add store management UI**

In `src/pages/SettingsPage.tsx`, update the import line:

```ts
import { useSettings, updateHourlyRate, updateSettings, addStore, deleteStore, setDefaultStore } from '../hooks/useSettings'
```

Add a `storeInput` state alongside the existing state declarations (after `const [connecting, setConnecting] = useState(false)`):

```ts
const [storeInput, setStoreInput] = useState('')
```

Add a handler function alongside `handleRateSave`/`handleConnect`:

```ts
async function handleAddStore() {
  const name = storeInput.trim()
  if (!name) return
  await addStore(name)
  setStoreInput('')
}
```

Insert a new "Stores" card between the "Rate history" block and the "Currency" block (i.e. right after the closing `)}` of the rate history `{settings.rateHistory.length > 0 && (...)}` block, before the `{/* Currency */}` comment):

```tsx
      {/* Stores */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        <div className="text-[#666] text-[9px] tracking-widest mb-3">STORES</div>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Store name"
            value={storeInput}
            onChange={e => setStoreInput(e.target.value)}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm outline-none"
          />
          <button onClick={handleAddStore} className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Add</button>
        </div>
        {settings.stores.length === 0 ? (
          <div className="text-[#444] text-xs">No stores added yet</div>
        ) : (
          settings.stores.map(store => (
            <div key={store.id} className="flex justify-between items-center mb-2 last:mb-0">
              <span className="text-white text-sm">{store.name}</span>
              <div className="flex items-center gap-3">
                {settings.defaultStoreId === store.id ? (
                  <span className="text-indigo-400 text-xs font-semibold">Default</span>
                ) : (
                  <button onClick={() => setDefaultStore(store.id)} className="text-[#666] text-xs">Set default</button>
                )}
                <button onClick={() => deleteStore(store.id)} className="text-red-400 text-xs">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `SettingsPage.tsx`

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`
- Open Settings, add two stores (e.g. "Riverside Cafe", "Downtown Deli")
- Confirm the first store added has no "Default" tag and shows "Set default"
- Click "Set default" on one — confirm it now shows the "Default" tag and the other shows "Set default"
- Click "Delete" on the non-default store — confirm it disappears from the list
- Delete the default store — confirm the list becomes empty and no store shows as default

- [ ] **Step 4: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: add Stores management card to Settings page"
```

---

### Task 5: Store field on the shift form (with Advanced options toggle)

**Files:**
- Modify: `src/components/shifts/ShiftFormRow.tsx`
- Modify: `src/components/shifts/LogShiftModal.tsx`

- [ ] **Step 1: Add `storeName` to `ShiftDraft` and an Advanced options toggle to `ShiftFormRow`**

Edit `src/components/shifts/ShiftFormRow.tsx`. Update the imports and `ShiftDraft`/`Props`:

```ts
import { useState } from 'react'
import DialPicker from '../ui/DialPicker'
import { calcHoursWorked, calcShiftPay } from '../../lib/calculations'
import type { Store } from '../../types'

const PRESETS = ['08:00–16:00', '09:00–17:00', '18:00–22:00', '22:00–06:00']

export interface ShiftDraft {
  startTime: string
  endTime: string
  label: string
  notes: string
  storeName: string
}

interface Props {
  draft: ShiftDraft
  rate: number
  symbol: string
  stores: Store[]
  onChange: (d: ShiftDraft) => void
  onRemove?: () => void
  index: number
}

export default function ShiftFormRow({ draft, rate, symbol, stores, onChange, onRemove, index }: Props) {
  const [mode, setMode] = useState<'dial' | 'manual'>('dial')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const hours = calcHoursWorked(draft.startTime, draft.endTime)
  const pay = calcShiftPay(draft.startTime, draft.endTime, rate)
```

Insert the advanced-options block right after the "Label" input block (after its closing `/>` and before the "Mode toggle" comment):

```tsx
      {/* Advanced options: override store for this shift */}
      {stores.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setAdvancedOpen(o => !o)}
            className="text-[#666] text-xs mb-2"
          >
            {advancedOpen ? '▾' : '▸'} Advanced options
          </button>
          {advancedOpen && (
            <select
              value={draft.storeName}
              onChange={e => onChange({ ...draft, storeName: e.target.value })}
              className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white text-sm outline-none"
            >
              <option value="">No store</option>
              {stores.map(store => (
                <option key={store.id} value={store.name}>{store.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

```

- [ ] **Step 2: Wire `storeName` and `stores` through `LogShiftModal`**

Edit `src/components/shifts/LogShiftModal.tsx` to match exactly:

```tsx
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import ShiftFormRow, { type ShiftDraft } from './ShiftFormRow'
import { addShift, updateShift } from '../../hooks/useShifts'
import { useSettings, getRateForDate } from '../../hooks/useSettings'
import { today } from '../../lib/dateHelpers'
import type { Shift } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  editShift?: Shift | null
}

const blankDraft = (storeName: string): ShiftDraft => ({ startTime: '08:00', endTime: '16:00', label: '', notes: '', storeName })

export default function LogShiftModal({ open, onClose, editShift }: Props) {
  const settings = useSettings()
  const [date, setDate] = useState(today())
  const [drafts, setDrafts] = useState<ShiftDraft[]>([blankDraft('')])
  const [saving, setSaving] = useState(false)

  const rate = settings?.currentHourlyRate ?? 0
  const symbol = settings?.currencySymbol ?? '£'
  const stores = settings?.stores ?? []
  const defaultStoreName = stores.find(s => s.id === settings?.defaultStoreId)?.name ?? ''
  const isEditing = !!editShift

  useEffect(() => {
    if (editShift) {
      setDate(editShift.date)
      setDrafts([{
        startTime: editShift.startTime,
        endTime: editShift.endTime,
        label: editShift.label,
        notes: editShift.notes,
        storeName: editShift.storeName,
      }])
    } else {
      setDate(today())
      setDrafts([blankDraft(defaultStoreName)])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editShift, open])

  function reset() {
    setDate(today())
    setDrafts([blankDraft(defaultStoreName)])
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (isEditing && editShift) {
        const d = drafts[0]
        const snapshotRate = await getRateForDate(date)
        await updateShift(editShift.id, {
          date,
          startTime: d.startTime,
          endTime: d.endTime,
          label: d.label,
          notes: d.notes,
          storeName: d.storeName,
          hourlyRateSnapshot: snapshotRate || rate,
        })
      } else {
        const snapshotRate = await getRateForDate(date)
        for (const d of drafts) {
          await addShift({
            date,
            startTime: d.startTime,
            endTime: d.endTime,
            label: d.label,
            notes: d.notes,
            storeName: d.storeName,
            hourlyRateSnapshot: snapshotRate || rate,
          })
        }
      }
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function updateDraft(i: number, d: ShiftDraft) {
    setDrafts(prev => prev.map((x, idx) => idx === i ? d : x))
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title={isEditing ? 'Edit Shift' : 'Log Shift'}>
      <div className="flex justify-end -mt-10 mb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-indigo-400 font-semibold text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Date */}
      <div className="bg-[#161616] border border-[#222] rounded-xl px-4 py-3 flex justify-between items-center mb-4">
        <span className="text-[#666] text-sm">Date</span>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-transparent text-white text-sm outline-none"
        />
      </div>

      {drafts.map((d, i) => (
        <ShiftFormRow
          key={i}
          index={i}
          draft={d}
          rate={rate}
          symbol={symbol}
          stores={stores}
          onChange={updated => updateDraft(i, updated)}
          onRemove={i > 0 ? () => setDrafts(prev => prev.filter((_, idx) => idx !== i)) : undefined}
        />
      ))}

      {!isEditing && (
        <button
          onClick={() => setDrafts(prev => [...prev, blankDraft(defaultStoreName)])}
          className="w-full border border-dashed border-[#333] rounded-xl py-3 text-[#666] text-sm mt-2"
        >
          + Add another shift for this day
        </button>
      )}
    </Modal>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `ShiftFormRow.tsx` or `LogShiftModal.tsx`

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev` (if not already running)
- With no stores configured: open "Log Shift" — confirm no "Advanced options" toggle appears, save a shift successfully
- Add a store and set it as default in Settings
- Open "Log Shift" again — confirm "Advanced options" now appears; leave it collapsed and save — confirm the new shift is silently tagged with the default store
- Open "Log Shift", expand "Advanced options", pick a different store (or "No store"), save — confirm that override is respected
- Edit an existing shift — confirm its current store is preselected when Advanced options is expanded

- [ ] **Step 5: Commit**

```bash
git add src/components/shifts/ShiftFormRow.tsx src/components/shifts/LogShiftModal.tsx
git commit -m "feat: add store field with Advanced options toggle to shift form"
```

---

### Task 6: Display store name in Recent Shifts and Reports

**Files:**
- Modify: `src/components/dashboard/RecentShiftsList.tsx`
- Modify: `src/pages/ReportsPage.tsx`

- [ ] **Step 1: Show store name in `RecentShiftsList`**

In `src/components/dashboard/RecentShiftsList.tsx`, change the subtitle line:

```tsx
              <div className="text-white text-sm">
                {formatDisplayDateWithWeekday(s.date)}
                {s.label ? ` · ${s.label}` : ''}
                {s.storeName ? ` · ${s.storeName}` : ''}
              </div>
```

(This replaces the existing single-line `<div className="text-white text-sm">{formatDisplayDateWithWeekday(s.date)}{s.label ? ...}</div>`.)

- [ ] **Step 2: Show store name in the Reports breakdown list**

In `src/pages/ReportsPage.tsx`, update the shift row subtitle:

```tsx
                    <div>
                      <div className="text-white text-sm">
                        {formatDisplayDateWithWeekday(item.date)}
                        {(item.data as Shift).label ? ` · ${(item.data as Shift).label}` : ''}
                        {(item.data as Shift).storeName ? ` · ${(item.data as Shift).storeName}` : ''}
                      </div>
                      <div className="text-[#666] text-xs">{(item.data as Shift).startTime} – {(item.data as Shift).endTime}</div>
                    </div>
```

(This replaces the existing `<div className="text-white text-sm">{formatDisplayDateWithWeekday(item.date)}{(item.data as Shift).label ? ...}</div>` line only — the payout branch and the rest of the file are unchanged.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Manually verify in the browser**

- Dashboard "Recent Shifts": confirm shifts with a store show `<date> · <label> · <store>` (or `<date> · <store>` if no label)
- Reports page breakdown list: confirm the same for shifts within the selected date range

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/RecentShiftsList.tsx src/pages/ReportsPage.tsx
git commit -m "feat: show store name in Recent Shifts and Reports breakdown"
```

---

### Task 7: Add store to PDF export and fix JSON export test

**Files:**
- Modify: `src/lib/pdfReport.ts`
- Modify: `src/tests/jsonReport.test.ts`

- [ ] **Step 1: Add a "Store" column to the PDF shifts table**

In `src/lib/pdfReport.ts`, update the shifts `autoTable` call:

```ts
  // Shifts table
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Store', 'Label', 'Start', 'End', 'Hours', 'Pay']],
    body: shifts.map(s => [
      formatDisplayDate(s.date),
      s.storeName || '—',
      s.label || '—',
      s.startTime,
      s.endTime,
      `${calcHoursWorked(s.startTime, s.endTime).toFixed(2)}h`,
      `${symbol}${calcShiftPay(s.startTime, s.endTime, effectiveRate(s, currentRate)).toFixed(2)}`,
    ]),
    foot: [['', '', '', '', 'Total',
      `${shifts.reduce((s, sh) => s + calcHoursWorked(sh.startTime, sh.endTime), 0).toFixed(2)}h`,
      `${symbol}${totalEarned.toFixed(2)}`,
    ]],
    styles: { fontSize: 8, textColor: [30, 30, 30] },
    headStyles: { fillColor: [40, 40, 40], textColor: [220, 220, 220], fontStyle: 'bold' },
    footStyles: { fillColor: [235, 235, 235], textColor: [30, 30, 30], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: margin, right: margin },
  })
```

(Only the `head`, `body`, and `foot` arrays change — everything else in the call is unchanged. The payouts table below it is untouched.)

- [ ] **Step 2: Fix the JSON report test's `Shift` literal**

`src/tests/jsonReport.test.ts` currently constructs a `Shift` literal without `storeName`, which will now fail to type-check. Edit it:

```ts
const shift: Shift = {
  id: '1', date: '2026-04-28', startTime: '08:00', endTime: '16:00',
  label: '', notes: '', storeName: '', hourlyRateSnapshot: 12,
  createdAt: '', updatedAt: '',
}
```

(Only the `shift` object gains `storeName: ''`; the rest of the file is unchanged.)

- [ ] **Step 3: Type-check and run the full test suite**

Run: `npx tsc --noEmit`
Expected: no errors

Run: `npx vitest run`
Expected: all tests PASS, including `jsonReport.test.ts` and the new `useSettings.test.ts`

- [ ] **Step 4: Manually verify PDF export in the browser**

Run: `npm run dev` (if not already running)
- Go to Reports, select a range containing shifts with and without a store
- Export PDF, open it, confirm the shifts table has a "Store" column showing the store name or "—"

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdfReport.ts src/tests/jsonReport.test.ts
git commit -m "feat: include store in PDF export; fix jsonReport test for storeName field"
```

---

### Task 8: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests PASS

- [ ] **Step 2: Full type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Full manual walkthrough in the browser**

Run: `npm run dev`
- Fresh state check: if testing against an existing IndexedDB database from before this change, confirm the app loads without errors (migration ran cleanly) and old shifts display normally with no store shown
- Add 2 stores in Settings, set one default, delete the other, confirm list updates correctly
- Log a new shift with no Advanced override — confirm it shows the default store in Recent Shifts
- Log a shift with an Advanced override to a different store — confirm it shows that store instead
- Set a *different* store as default — confirm only shifts that never had an explicit store get backfilled to the new default; shifts with an explicit store (including previously backfilled ones) keep their existing store name
- Check Reports breakdown list and PDF export both show correct store names
- Check JSON export (download and open the file) — confirm `storeName` is present on each shift

- [ ] **Step 4: Confirm no leftover uncommitted changes**

Run: `git status`
Expected: clean working tree (all changes committed in prior tasks)
