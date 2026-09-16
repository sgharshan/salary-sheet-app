import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettings } from '../hooks/useSettings'
import { calcShiftPay, calcHoursWorked } from '../lib/calculations'
import { calcOutstanding } from '../lib/calculations'
import { weekStart, weekEnd, monthStart, monthEnd, today, toISODate, formatDisplayDateWithWeekday } from '../lib/dateHelpers'
import { deleteShift } from '../hooks/useShifts'
import SummaryCards from '../components/dashboard/SummaryCards'
import RecentShiftsList from '../components/dashboard/RecentShiftsList'
import LogShiftModal from '../components/shifts/LogShiftModal'
import type { Shift } from '../types'
import Icon from '../components/ui/Icon'

export default function Dashboard() {
  const { openLogShift } = useOutletContext<{ openLogShift: () => void }>()
  const settings = useSettings()
  const symbol = settings?.currencySymbol ?? '£'
  const todayStr = today()
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const weekShifts = useLiveQuery(() =>
    db.shifts.where('date').between(weekStart(todayStr), weekEnd(todayStr), true, true).toArray()
  , [todayStr]) ?? []

  const monthShifts = useLiveQuery(() =>
    db.shifts.where('date').between(monthStart(todayStr), monthEnd(todayStr), true, true).toArray()
  , [todayStr]) ?? []

  const allShifts = useLiveQuery(() => db.shifts.orderBy('date').reverse().toArray()) ?? []
  const allPayouts = useLiveQuery(() => db.payouts.orderBy('date').reverse().toArray()) ?? []

  const weekEarned = weekShifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)
  const monthEarned = monthShifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)
  const totalEarned = allShifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)
  const totalPaid = allPayouts.reduce((s, p) => s + p.amount, 0)
  const lastPayout = allPayouts[0] ?? null
  const weekHours = weekShifts.reduce((sum, shift) => sum + calcHoursWorked(shift.startTime, shift.endTime), 0)
  const [weekYear, weekMonth, weekDay] = weekStart(todayStr).split('-').map(Number)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekYear, weekMonth - 1, weekDay + index)
    const iso = toISODate(date)
    const shifts = weekShifts.filter(shift => shift.date === iso)
    return { iso, day: date.toLocaleDateString('en-GB', { weekday: 'short' }), date: date.getDate(), shifts: shifts.length }
  })

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><h1>Overview</h1><p>Your hours, earnings, and pay in one place.</p></div>
        <span className="pt-1 text-xs text-zinc-400 sm:pt-3">{formatDisplayDateWithWeekday(todayStr)}</span>
      </header>
      <SummaryCards
        weekEarned={weekEarned}
        monthEarned={monthEarned}
        lastPayoutAmount={lastPayout?.amount ?? null}
        lastPayoutDate={lastPayout?.date ?? null}
        outstanding={calcOutstanding(totalEarned, totalPaid)}
        symbol={symbol}
      />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="section-heading">Recent shifts</h2><p className="mt-1 text-xs text-zinc-400">Your latest {Math.min(allShifts.length, 10)} logged shifts</p></div>
            <Link to="/calendar" className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-indigo-300">Calendar<Icon name="arrow" width="16" height="16" /></Link>
          </div>
          <RecentShiftsList shifts={allShifts.slice(0, 10)} symbol={symbol} onEditShift={setEditingShift} onDeleteShift={deleteShift} onLogShift={openLogShift} />
        </section>
        <aside className="space-y-5">
          <section className="surface p-5">
            <h2 className="section-heading">Your week</h2>
            <div className="mt-2 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-tight tabular-nums">{weekHours.toFixed(1)}<span className="ml-1 text-sm font-normal text-zinc-400">hrs</span></span><span className="text-xs text-zinc-400">across {weekShifts.length} {weekShifts.length === 1 ? 'shift' : 'shifts'}</span></div>
            <div className="mt-5 grid grid-cols-7 gap-1" aria-label="Shifts logged this week">
              {days.map(day => <div key={day.iso} className={`flex flex-col items-center rounded-xl py-2 ${day.iso === todayStr ? 'bg-indigo-400/10 ring-1 ring-indigo-400/25' : ''}`} aria-label={`${formatDisplayDateWithWeekday(day.iso)}: ${day.shifts} shifts`}>
                <span className="text-[10px] text-zinc-400">{day.day}</span><span className="mt-2 text-sm tabular-nums">{day.date}</span><span className={`mt-2 h-1.5 w-1.5 rounded-full ${day.shifts ? 'bg-[#86d7ac]' : 'bg-zinc-700'}`} aria-hidden="true" />
              </div>)}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-[#86d7ac]" />Shift logged</p>
          </section>
          <Link to="/reports" className="group flex items-center gap-4 rounded-2xl border border-[#292929] p-5 transition-colors hover:border-zinc-500">
            <span className="text-indigo-300"><Icon name="reports" width="24" height="24" /></span>
            <div className="flex-1"><h2 className="text-sm font-medium">See the full picture</h2><p className="mt-1 text-xs leading-relaxed text-zinc-400">Review a pay period and export your report.</p></div><Icon name="arrow" width="18" height="18" className="text-zinc-400" />
          </Link>
        </aside>
      </div>

      <LogShiftModal
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        editShift={editingShift}
      />
    </div>
  )
}
