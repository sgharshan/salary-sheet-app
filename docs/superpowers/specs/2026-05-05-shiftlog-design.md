# ShiftLog — Design Spec
**Date:** 2026-05-05  
**Status:** Approved

---

## 1. Overview

ShiftLog is a personal, mobile-first Progressive Web App (PWA) for recording work shifts, tracking salary earned, logging payouts received, and generating reports. It is a zero-cost, single-user application with no authentication. Data lives locally on the device (IndexedDB) and syncs to Google Drive when online.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Rich component ecosystem, fast builds, PWA support |
| Local DB | Dexie.js (IndexedDB) | Offline-first, works without network |
| Cloud sync | Google Drive API v3 | Free 15GB, user already has Google account |
| PDF export | jsPDF + jsPDF-AutoTable | Free, browser-based, no server needed |
| JSON export | Native browser download | No library needed |
| Hosting | GitHub Pages | Free, zero cost |
| Styling | Tailwind CSS | Utility-first, consistent dark theme |

**Zero cost.** No paid services, no subscriptions.

---

## 3. Architecture

### Storage Strategy (Offline-First)

All reads and writes go to **IndexedDB (Dexie.js)** first. The app is fully usable without internet. When the device goes online, a background sync worker pushes local changes to a single file (`shiftlog-data.json`) in the user's Google Drive. When opening on a new device, it pulls from Drive and populates IndexedDB.

```
User action → IndexedDB (primary, always) → sync queue
                                              ↓ (when online)
                                         Google Drive (shiftlog-data.json)
```

Conflict resolution: last-write-wins using a `lastModified` timestamp. Since this is single-user, conflicts are rare (only occur when editing on two devices offline simultaneously).

### Google Drive Integration

- Uses Google OAuth 2.0 via Google Identity Services (GIS) — one-time sign-in, token stored in localStorage
- Requires a free Google Cloud Console project with Drive API enabled and an OAuth 2.0 Client ID (one-time setup, no cost)
- Stores one file: `shiftlog-data.json` in the app's Drive folder
- Sync is triggered on: app open (if online), after every write (debounced 5s), and when network comes back online

---

## 4. Data Model

### Shifts
```json
{
  "id": "uuid",
  "date": "2026-05-05",
  "startTime": "08:00",
  "endTime": "16:00",
  "label": "Morning",
  "notes": "",
  "hourlyRateSnapshot": 12.00,
  "createdAt": "2026-05-05T08:30:00Z",
  "updatedAt": "2026-05-05T08:30:00Z"
}
```
`hourlyRateSnapshot` records the rate active on that date so historical records remain accurate when the rate changes later.

### Payouts
```json
{
  "id": "uuid",
  "date": "2026-05-02",
  "amount": 300.00,
  "notes": "Weekly pay",
  "createdAt": "2026-05-02T10:00:00Z",
  "updatedAt": "2026-05-02T10:00:00Z"
}
```

### Settings
```json
{
  "currency": "GBP",
  "currencySymbol": "£",
  "currentHourlyRate": 12.00,
  "rateHistory": [
    { "rate": 10.50, "effectiveFrom": "2024-01-01" },
    { "rate": 12.00, "effectiveFrom": "2026-01-01" }
  ],
  "lastSyncedAt": "2026-05-05T08:00:00Z"
}
```

---

## 5. Screens & Navigation

### Navigation Pattern
Hamburger menu (slides in from left) + floating **"+ Log Shift"** button always visible on screen. No persistent tab bar — maximises screen space on mobile.

Hamburger menu items: Home · Calendar · Reports · **Log Payout** · Settings. "Log Payout" is also accessible from the calendar day-detail panel when tapping a date.

### Screens

#### Home Dashboard
- 4 summary cards: This Week earned / This Month earned / Last Payout / Outstanding (red)
- Recent shifts list (last 7 days, chronological, most recent first)
- Floating "+ Log Shift" button (bottom centre)
- Sync status indicator (top right: green dot = synced, amber = pending, grey = offline)

#### Calendar
- Monthly calendar grid (Monday–Sunday)
- Dot indicators per date:
  - Green dot = shift worked
  - Amber dot = payout received
  - Two green dots = double shift
  - Purple dot = both shift and payout on same day
- Tap a date → detail panel slides up showing all shifts and payouts for that date with individual totals and day total

#### Log Shift (modal/sheet)
- Date picker (defaults to today)
- Optional label field (free text: Morning / Evening / Night / etc.)
- Time entry toggle: **Dial** (default) or **Manual**
  - **Dial mode**: iOS-style scroll drum — two drums side by side (Start / End), swipe to spin, highlighted selection band
  - **Manual mode**: Large tap-to-type time fields (HH:MM) + quick preset buttons for common shifts (e.g. 08:00–16:00, 09:00–17:00, 18:00–22:00, 22:00–06:00)
- Live calculation bar: Duration · Rate · Earned
- "Add another shift for this day" button (for double/triple shifts — adds a second shift form inline)
- Optional notes field
- Cancel / Save buttons

#### Log Payout (modal/sheet)
- Date picker (defaults to today)
- Amount field (numeric, currency symbol prefix)
- Optional notes field
- Cancel / Save buttons

#### Reports
- Date range selector: quick presets (This Week / This Month / Last Month / Custom)
- Custom range: two date pickers (From / To)
- Live summary preview:
  - Shifts worked (count + total hours)
  - Total earned
  - Payouts received
  - Outstanding balance (red)
- Chronological breakdown list (shifts and payouts interleaved)
- Export buttons: **PDF** and **JSON**

#### Settings
- Current hourly rate (editable inline, shows effective date)
- Rate history log (read-only list of past rates)
- Currency selector
- Google Drive: connect/disconnect button + last sync time
- About / version

---

## 6. PDF Report Layout

White background, print-optimised. Sections:

1. **Header**: App name (SHIFTLOG) + date range + generation date
2. **Summary boxes** (3 columns): Total Earned / Paid Out / Outstanding (red border)
3. **Rate note**: "Hourly rate applied: £X.XX/hr (effective DD MMM YYYY)"
4. **Shifts table**: Date | Label | Start | End | Hours | Pay — totalled at bottom
5. **Payouts table**: Date | Notes | Amount — totalled at bottom
6. **Outstanding balance**: large red box, Earned minus Payouts
7. **Footer**: "Generated by ShiftLog" + page number

Double/triple shifts on same day appear as separate rows with coloured label text, sharing the same date cell.

---

## 7. JSON Export Format

```json
{
  "reportMeta": {
    "generatedAt": "2026-05-05T10:00:00Z",
    "dateRange": { "from": "2026-04-28", "to": "2026-05-05" },
    "currency": "GBP",
    "hourlyRate": 12.00
  },
  "summary": {
    "totalShifts": 5,
    "totalHours": 38,
    "totalEarned": 456.00,
    "totalPayouts": 300.00,
    "outstanding": 156.00
  },
  "shifts": [ /* shift records */ ],
  "payouts": [ /* payout records */ ]
}
```

---

## 8. Design Language

- **Theme**: Dark, minimalist. Background `#0a0a0a`, surface `#161616`, border `#222`
- **Accent**: Indigo `#6366f1` (buttons, selected states)
- **Success/Earnings**: Green `#4ade80`
- **Outstanding/Alert**: Red `#f87171`
- **Payouts**: Amber `#f59e0b`
- **Typography**: System font stack, generous letter-spacing for labels
- **Mobile-first**: Designed for phone screens, touch targets minimum 44px

---

## 9. Pay Calculation Rule

```
shift_pay = hours_worked × hourlyRateSnapshot
hours_worked = (endTime - startTime) in decimal hours

# Dashboard outstanding (all-time, global):
outstanding_global = sum(ALL shift_pay ever) - sum(ALL payouts ever)

# Report outstanding (scoped to selected date range):
outstanding_range = sum(shift_pay in range) - sum(payouts in range)
```

Overnight shifts (e.g. 22:00–06:00) are handled by detecting `endTime < startTime` and adding 24h to end.

---

## 10. Out of Scope

- Multi-user / team features
- Overtime pay calculations
- Employer payslip import
- Push notifications
- Native mobile app (PWA only)
