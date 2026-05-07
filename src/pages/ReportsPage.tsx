import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettings } from '../hooks/useSettings'
import { calcShiftPay, calcHoursWorked, calcOutstanding } from '../lib/calculations'
import { today, weekStart, weekEnd, monthStart, monthEnd, prevMonthStart, prevMonthEnd, formatDisplayDate } from '../lib/dateHelpers'
import { generatePdf } from '../lib/pdfReport'
import { buildJsonReport, downloadJson } from '../lib/jsonReport'
import type { Shift, Payout } from '../types'

type Preset = 'week' | 'month' | 'lastMonth' | 'custom'

export default function ReportsPage() {
  const settings = useSettings()
  const symbol = settings?.currencySymbol ?? '£'
  const todayStr = today()

  const [preset, setPreset] = useState<Preset>('week')
  const [from, setFrom] = useState(weekStart(todayStr))
  const [to, setTo] = useState(weekEnd(todayStr))

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === 'week') { setFrom(weekStart(todayStr)); setTo(weekEnd(todayStr)) }
    if (p === 'month') { setFrom(monthStart(todayStr)); setTo(monthEnd(todayStr)) }
    if (p === 'lastMonth') { setFrom(prevMonthStart(todayStr)); setTo(prevMonthEnd(todayStr)) }
  }

  const shifts = useLiveQuery(() =>
    db.shifts.where('date').between(from, to, true, true).toArray()
  , [from, to]) ?? []
  const payouts = useLiveQuery(() =>
    db.payouts.where('date').between(from, to, true, true).toArray()
  , [from, to]) ?? []

  const totalEarned = shifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)
  const totalHours = shifts.reduce((s, sh) => s + calcHoursWorked(sh.startTime, sh.endTime), 0)
  const totalPaid = payouts.reduce((s, p) => s + p.amount, 0)
  const outstanding = calcOutstanding(totalEarned, totalPaid)

  const allItems = [
    ...shifts.map(s => ({ type: 'shift' as const, date: s.date, data: s as Shift | Payout })),
    ...payouts.map(p => ({ type: 'payout' as const, date: p.date, data: p as Shift | Payout })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  function handlePdf() {
    generatePdf(shifts, payouts, from, to, symbol, settings?.currency ?? 'GBP', settings?.currentHourlyRate ?? 0)
  }

  function handleJson() {
    const report = buildJsonReport(shifts, payouts, from, to, settings?.currency ?? 'GBP', settings?.currentHourlyRate ?? 0)
    downloadJson(report, `ShiftLog-${from}-to-${to}.json`)
  }

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'custom', label: 'Custom…' },
  ]

  return (
    <div>
      <div className="text-[#444] text-[9px] tracking-widest mb-3 pt-2">DATE RANGE</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${preset === p.key ? 'bg-indigo-500 text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#888]'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#161616] border border-[#222] rounded-xl p-3">
            <div className="text-[#444] text-[9px] tracking-widest mb-1">FROM</div>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-transparent text-white text-xs outline-none" />
          </div>
          <div className="bg-[#161616] border border-[#222] rounded-xl p-3">
            <div className="text-[#444] text-[9px] tracking-widest mb-1">TO</div>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-transparent text-white text-xs outline-none" />
          </div>
        </div>
      )}

      <div className="text-[#444] text-[9px] tracking-widest mb-2">SUMMARY</div>
      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        {[
          { label: 'Shifts worked', value: `${shifts.length} shifts · ${totalHours.toFixed(1)}h`, color: 'text-white' },
          { label: 'Total earned', value: `${symbol}${totalEarned.toFixed(2)}`, color: 'text-green-400' },
          { label: 'Payouts received', value: `${symbol}${totalPaid.toFixed(2)}`, color: 'text-white' },
        ].map(r => (
          <div key={r.label} className="flex justify-between mb-2">
            <span className="text-[#888] text-sm">{r.label}</span>
            <span className={`${r.color} text-sm font-semibold`}>{r.value}</span>
          </div>
        ))}
        <div className="border-t border-[#222] my-2" />
        <div className="flex justify-between">
          <span className="text-[#888] text-sm">Outstanding</span>
          <span className="text-red-400 font-bold text-base">{symbol}{outstanding.toFixed(2)}</span>
        </div>
      </div>

      {allItems.length > 0 && (
        <>
          <div className="text-[#444] text-[9px] tracking-widest mb-2">BREAKDOWN</div>
          <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl overflow-hidden mb-4">
            {allItems.map((item, i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-3 ${i < allItems.length - 1 ? 'border-b border-[#1e1e1e]' : ''}`}>
                {item.type === 'shift' ? (
                  <>
                    <div>
                      <div className="text-white text-sm">{formatDisplayDate(item.date)}{(item.data as Shift).label ? ` · ${(item.data as Shift).label}` : ''}</div>
                      <div className="text-[#666] text-xs">{(item.data as Shift).startTime} – {(item.data as Shift).endTime}</div>
                    </div>
                    <div className="text-green-400 text-sm font-semibold">
                      {symbol}{calcShiftPay((item.data as Shift).startTime, (item.data as Shift).endTime, (item.data as Shift).hourlyRateSnapshot).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-amber-400 text-sm">{formatDisplayDate(item.date)} · Payout</div>
                      <div className="text-[#666] text-xs">{(item.data as Payout).notes || ''}</div>
                    </div>
                    <div className="text-amber-400 text-sm font-semibold">-{symbol}{(item.data as Payout).amount.toFixed(2)}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-[#444] text-[9px] tracking-widest mb-2">EXPORT</div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handlePdf} className="bg-indigo-500 rounded-xl py-4 text-white font-semibold text-sm">
          Export PDF
        </button>
        <button onClick={handleJson} className="bg-[#161616] border border-[#333] rounded-xl py-4 text-white font-semibold text-sm">
          Export JSON
        </button>
      </div>
    </div>
  )
}
