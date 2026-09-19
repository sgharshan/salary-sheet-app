# ShiftLog review and next updates

ShiftLog is a personal, offline-first work and pay ledger. It records shifts across stores, calculates pay from each shift's saved hourly rate, records payments received, and exports date-range reports. Home shows the all-time unpaid balance; Reports shows the balance for the selected period. Payments are records of money received, not bank transfers.

## UI work completed

- Retained the charcoal and indigo style with clearer type, larger controls, responsive layouts, and reduced-motion support.
- Added accessible desktop navigation, a mobile navigation dialog, and direct Log Shift / Log Payout actions.
- Improved dashboard summaries, recent shifts, and the weekly activity view.
- Added visible mouse/keyboard record actions and deletion confirmation while retaining swipe gestures.
- Improved modal focus, Escape handling, scroll locking, and exact-minute time selection.
- Added clearer calendar date selection, Today navigation, and report date-range validation and empty states.
- Matched shift pay previews to saved rates and preserved existing rate snapshots when editing.
- Added a separate, pinned Confirm payout footer, labeled fields, validation, duplicate-submit protection, and retryable save errors.
- Loaded the PDF exporter on demand, with progress and error feedback.
- Restored the ESLint configuration so the existing lint command works.

## Recommended next updates

1. **Audit rate-history and export consistency.** The rate-change writer archives the old rate using the change date, while the lookup interprets dates as the beginning of a rate period. Resolve those semantics and test existing history before migrating data. PDF currently substitutes the current rate for zero-rate snapshots; screen and JSON calculations preserve zero. These are separate from the form preview and edit fixes above.
2. **Strengthen Drive sync and add full backup/restore.** Check HTTP failures, report background sync failures accurately, and handle deletions and conflicts across devices. The existing report JSON export is date-scoped and is not a full settings backup.
3. **Add store filtering and CSV export.** Make it easier to review work at a particular location or open a report in a spreadsheet. Keep payouts clearly separate from store earnings until payments can be allocated to stores.
4. **Add a repeat-shift shortcut.** Reuse times, labels, and store selection while applying the correct rate for the new shift's date.
5. **Consider unpaid breaks.** Add explicit break minutes and update summaries and exports together, after agreeing how breaks affect recorded hours and pay.

These next updates are recommendations, not features included in the UI refresh. Existing stored records and the sync data model were not migrated during this pass.
