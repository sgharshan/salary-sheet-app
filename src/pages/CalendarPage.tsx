import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettings } from '../hooks/useSettings'
import CalendarGrid from '../components/calendar/CalendarGrid'
import DayDetailPanel from '../components/calendar/DayDetailPanel'
import LogShiftModal from '../components/shifts/LogShiftModal'
import LogPayoutModal from '../components/payouts/LogPayoutModal'
import { deleteShift } from '../hooks/useShifts'
import { deletePayout } from '../hooks/usePayouts'
import { toISODate } from '../lib/dateHelpers'
import type { Shift, Payout } from '../types'

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(toISODate(now))
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [editingPayout, setEditingPayout] = useState<Payout | null>(null)
  const settings = useSettings()
  const symbol = settings?.currencySymbol ?? '£'

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const shifts = useLiveQuery(() =>
    db.shifts.where('date').startsWith(monthStr).toArray()
  , [monthStr]) ?? []
  const payouts = useLiveQuery(() =>
    db.payouts.where('date').startsWith(monthStr).toArray()
  , [monthStr]) ?? []

  const selectedShifts = shifts.filter(s => s.date === selectedDate)
  const selectedPayouts = payouts.filter(p => p.date === selectedDate)

  function prevMonth() {
    const previous = new Date(year, month - 1, 1)
    setYear(previous.getFullYear())
    setMonth(previous.getMonth())
    setSelectedDate(toISODate(previous))
  }
  function nextMonth() {
    const next = new Date(year, month + 1, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setSelectedDate(toISODate(next))
  }

  function showToday() {
    const current = new Date()
    setYear(current.getFullYear())
    setMonth(current.getMonth())
    setSelectedDate(toISODate(current))
  }

  const monthLabel = new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="page-stack">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1>Calendar</h1>
          <p>A little perspective on your working month.</p>
        </div>
        <button onClick={showToday} className="button-secondary shrink-0">Today</button>
      </header>

      <section className="surface p-3 sm:p-5" aria-label="Monthly activity calendar">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button onClick={prevMonth} className="icon-button" aria-label="Previous month">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          </button>
          <h2 className="text-base font-semibold text-white" aria-live="polite">{monthLabel}</h2>
          <button onClick={nextMonth} className="icon-button" aria-label="Next month">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
          </button>
        </div>

        <CalendarGrid
          year={year} month={month}
          shifts={shifts} payouts={payouts}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#292929] pt-4">
          <div className="flex gap-4">
            {[['bg-[#86d7ac]', 'Shift'], ['bg-amber-300', 'Payout']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${c}`} aria-hidden="true" />
                <span className="text-xs text-zinc-400">{l}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">Select a day for details</p>
        </div>
      </section>

      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          shifts={selectedShifts}
          payouts={selectedPayouts}
          symbol={symbol}
          onEditShift={setEditingShift}
          onDeleteShift={deleteShift}
          onEditPayout={setEditingPayout}
          onDeletePayout={deletePayout}
        />
      )}

      <LogShiftModal
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        editShift={editingShift}
      />
      <LogPayoutModal
        open={!!editingPayout}
        onClose={() => setEditingPayout(null)}
        editPayout={editingPayout}
      />
    </div>
  )
}
