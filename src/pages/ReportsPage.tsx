import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettings } from '../hooks/useSettings'
import { calcShiftPay, calcHoursWorked, calcOutstanding } from '../lib/calculations'
import { today, weekStart, weekEnd, monthStart, monthEnd, prevMonthStart, prevMonthEnd, formatDisplayDateWithWeekday } from '../lib/dateHelpers'
import { buildJsonReport, downloadJson } from '../lib/jsonReport'

type Preset = 'week' | 'month' | 'lastMonth' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'custom', label: 'Custom' },
]

export default function ReportsPage() {
  const settings = useSettings()
  const symbol = settings?.currencySymbol ?? '£'
  const todayStr = today()
  const [preset, setPreset] = useState<Preset>('week')
  const [from, setFrom] = useState(weekStart(todayStr))
  const [to, setTo] = useState(weekEnd(todayStr))
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState('')
  const rangeValid = Boolean(from && to && from <= to)

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === 'week') { setFrom(weekStart(todayStr)); setTo(weekEnd(todayStr)) }
    if (p === 'month') { setFrom(monthStart(todayStr)); setTo(monthEnd(todayStr)) }
    if (p === 'lastMonth') { setFrom(prevMonthStart(todayStr)); setTo(prevMonthEnd(todayStr)) }
  }

  const queriedShifts = useLiveQuery(() =>
    rangeValid ? db.shifts.where('date').between(from, to, true, true).toArray() : []
  , [from, to, rangeValid])
  const queriedPayouts = useLiveQuery(() =>
    rangeValid ? db.payouts.where('date').between(from, to, true, true).toArray() : []
  , [from, to, rangeValid])
  const shifts = rangeValid ? queriedShifts ?? [] : []
  const payouts = rangeValid ? queriedPayouts ?? [] : []

  const totalEarned = shifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)
  const totalHours = shifts.reduce((s, sh) => s + calcHoursWorked(sh.startTime, sh.endTime), 0)
  const totalPaid = payouts.reduce((s, p) => s + p.amount, 0)
  const outstanding = calcOutstanding(totalEarned, totalPaid)
  const allItems = [
    ...shifts.map(s => ({ type: 'shift' as const, date: s.date, data: s })),
    ...payouts.map(p => ({ type: 'payout' as const, date: p.date, data: p })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  async function handlePdf() {
    if (!rangeValid || exportingPdf) return
    setExportingPdf(true)
    setExportError('')
    try {
      const { generatePdf } = await import('../lib/pdfReport')
      generatePdf(shifts, payouts, from, to, symbol, settings?.currency ?? 'GBP', settings?.currentHourlyRate ?? 0)
    } catch {
      setExportError('Could not create your PDF. Please try again.')
    } finally {
      setExportingPdf(false)
    }
  }

  function handleJson() {
    if (!rangeValid || exportingPdf) return
    const report = buildJsonReport(shifts, payouts, from, to, settings?.currency ?? 'GBP', settings?.currentHourlyRate ?? 0)
    downloadJson(report, `ShiftLog-${from}-to-${to}.json`)
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Reports</h1>
        <p>Your hours and earnings, with everything in one place.</p>
      </header>

      <section className="surface p-4 sm:p-5" aria-labelledby="report-period-heading">
        <h2 id="report-period-heading" className="section-heading mb-3">Date range</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              aria-pressed={preset === p.key}
              className={`min-h-11 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${preset === p.key ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-inset ring-indigo-400/40' : 'bg-[#202020] text-zinc-400 hover:bg-[#292929] hover:text-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <label className="min-w-0">
              <span className="field-label">From</span>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} aria-invalid={!rangeValid} aria-describedby={!rangeValid ? 'report-range-error' : undefined} className="field-input w-full min-w-0" />
            </label>
            <label className="min-w-0">
              <span className="field-label">To</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} aria-invalid={!rangeValid} aria-describedby={!rangeValid ? 'report-range-error' : undefined} className="field-input w-full min-w-0" />
            </label>
          </div>
        )}
        {rangeValid ? (
          <p className="mt-4 text-xs leading-relaxed text-zinc-400">
            {formatDisplayDateWithWeekday(from)} <span className="mx-1 text-zinc-600">—</span> {formatDisplayDateWithWeekday(to)}
          </p>
        ) : (
          <p id="report-range-error" role="alert" className="mt-4 rounded-xl bg-red-400/10 px-3 py-3 text-sm text-red-300">
            Choose both dates, with the end date on or after the start date.
          </p>
        )}
      </section>

      {rangeValid && (
        <>
          <section aria-labelledby="report-summary-heading">
            <h2 id="report-summary-heading" className="section-heading mb-3">Period summary</h2>
            <div className="surface overflow-hidden">
              <div className="border-b border-[#292929] p-5">
                <p className="text-sm text-zinc-400">Total earned</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-[#86d7ac] tabular-nums">{symbol}{totalEarned.toFixed(2)}</p>
                <p className="mt-2 text-sm text-zinc-400">{shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'} <span className="mx-1 text-zinc-600">·</span> {totalHours.toFixed(1)} hours worked</p>
              </div>
              <dl className="space-y-3 p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Payouts received</dt>
                  <dd className="font-medium text-white tabular-nums">{symbol}{totalPaid.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Outstanding in this period</dt>
                  <dd className={`font-semibold tabular-nums ${outstanding > 0 ? 'text-amber-300' : 'text-white'}`}>{symbol}{outstanding.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section aria-labelledby="report-breakdown-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="report-breakdown-heading" className="section-heading">Breakdown</h2>
              <span className="text-xs text-zinc-500">{allItems.length} entries</span>
            </div>
            {allItems.length === 0 ? (
              <div className="surface empty-state">
                <p className="font-medium text-zinc-200">No activity in this period</p>
                <p className="mt-2 text-sm text-zinc-400">Try a different date range to find your shifts and payouts.</p>
              </div>
            ) : (
              <div className="surface divide-y divide-[#292929] overflow-hidden">
                {allItems.map(item => (
                  <div key={`${item.type}-${item.data.id}`} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
                    {item.type === 'shift' ? (
                      <>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100">{formatDisplayDateWithWeekday(item.date)}</p>
                          <p className="mt-1 text-xs text-zinc-400">{item.data.startTime} – {item.data.endTime} <span className="mx-1 text-zinc-600">·</span> {calcHoursWorked(item.data.startTime, item.data.endTime).toFixed(1)}h</p>
                          {(item.data.label || item.data.storeName) && <p className="mt-1 break-words text-xs text-zinc-400">{[item.data.label, item.data.storeName].filter(Boolean).join(' · ')}</p>}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-[#86d7ac] tabular-nums">{symbol}{calcShiftPay(item.data.startTime, item.data.endTime, item.data.hourlyRateSnapshot).toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100">{formatDisplayDateWithWeekday(item.date)}</p>
                          <p className="mt-1 text-xs text-amber-300">Payout received</p>
                          {item.data.notes && <p className="mt-1 break-words text-xs text-zinc-400">{item.data.notes}</p>}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-amber-300 tabular-nums">-{symbol}{item.data.amount.toFixed(2)}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section aria-labelledby="report-export-heading">
        <h2 id="report-export-heading" className="section-heading mb-2">Take your report with you</h2>
        <p className="mb-4 text-sm text-zinc-400">Save a PDF to share, or download the detailed data as JSON.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handlePdf} disabled={!rangeValid || exportingPdf} aria-busy={exportingPdf} aria-live="polite" className="button-primary">
            {exportingPdf ? 'Preparing PDF…' : 'Export PDF'}
          </button>
          <button onClick={handleJson} disabled={!rangeValid || exportingPdf} className="button-secondary">Export JSON</button>
        </div>
        {exportError && <p role="alert" className="mt-3 rounded-xl bg-red-400/10 px-3 py-3 text-sm text-red-300">{exportError}</p>}
      </section>
    </div>
  )
}
