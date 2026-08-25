# Store/Shop Tracking for Shifts — Design

## Problem

Shifts currently have no concept of *where* they were worked. Users who work at more than one shop have no way to record which shop a given shift belongs to, and no way to configure a default shop so most shifts don't require any extra input.

## Data Model

### New type

```ts
export interface Store {
  id: string
  name: string
}
```

### `Settings` additions

```ts
stores: Store[]
defaultStoreId: string | null
```

### `Shift` addition

```ts
storeName: string   // '' if none. Snapshot of the store's name at save time.
```

`storeName` is a **snapshot**, not a foreign key — the same pattern the app already uses for `hourlyRateSnapshot`. This means deleting a `Store` later never orphans or corrupts historical shift data; the shift simply keeps the plain-text name it was given at save time.

### Migration

Bump the Dexie schema version. On upgrade:
- Existing `Settings` row gets `stores: []`, `defaultStoreId: null`.
- Existing `Shift` rows are left as-is (no `storeName` property yet); application code treats a missing `storeName` the same as `''`.

## Settings Page — "Stores" Card

A new card, styled consistently with the existing Settings cards (rate, currency, etc.):

- Text input + "Add" button to create a new store by name.
- List of existing stores, each row showing:
  - Store name
  - A "Set as default" action (or a "Default" tag if it already is the default)
  - A delete button — deletion is instant, no confirmation dialog (matches the existing shift/payout delete UX in this app, which is also confirmation-free).
- The store currently marked default is visually distinguished (e.g. small "Default" tag/pill).

### Backfill on default change

Whenever `defaultStoreId` is set or changed (including the first time it's set), run a one-off backfill: every shift whose `storeName` is currently `''` gets updated to the new default store's name.

This is a one-time write, not a live lookup — it satisfies "old shifts should retroactively show the default store" without breaking the snapshot model. It only touches shifts that have never had an explicit store (empty `storeName`); shifts that already have a store name (explicit or previously backfilled) are never touched by a later default change.

## Logging / Editing a Shift

- By default, a new shift silently snapshots the current default store's name into `storeName`. No UI interaction required for the common case (single shop, or "usually this shop").
- `ShiftFormRow` gains a collapsed **"Advanced options"** toggle.
  - If `settings.stores` is empty, this toggle does not render at all.
  - When expanded, it reveals a store `<select>` populated from `settings.stores`, allowing the user to override the store for that specific shift (e.g. covering a shift at a different shop).
- Editing an existing shift shows its current `storeName` as the initial value; if it doesn't match any current store name exactly (e.g. the store it was tagged with has since been renamed/deleted), the raw snapshot name is preserved unless the user actively changes it via Advanced options.

## Display

- **Recent Shifts** (`RecentShiftsList.tsx`) and the **Reports breakdown list** (`ReportsPage.tsx`) always show the shift's store name (when non-empty) as part of the row's subtitle, alongside the existing label.
- **PDF export** (`pdfReport.ts`): the shifts `autoTable` gains a "Store" column.
- **JSON export** (`jsonReport.ts`): no code change needed — `storeName` is included automatically since the export serializes full `Shift` objects.

## Out of Scope (YAGNI)

- Per-store hourly rates.
- Filtering or aggregating reports by store.
- Confirmation dialogs before deleting a store.
- Renaming a store in place, beyond delete + re-add (unless trivial to include during implementation — not a hard requirement).

## Testing

- Unit coverage for the backfill logic (only empty `storeName` shifts get updated; already-set ones don't).
- Unit coverage for `getRateForDate`-style helper additions if any are introduced for store resolution.
- Existing `dateHelpers`/`calculations` test patterns should be followed for any new pure functions in `useSettings.ts` or similar.
