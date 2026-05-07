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
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex justify-between items-center mb-4 pt-2">
        <button onClick={prevMonth} className="text-[#888] text-lg px-2">‹</button>
        <span className="text-white font-semibold text-sm">{monthLabel}</span>
        <button onClick={nextMonth} className="text-[#888] text-lg px-2">›</button>
      </div>

      <CalendarGrid
        year={year} month={month}
        shifts={shifts} payouts={payouts}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <div className="flex gap-4 mt-3 mb-2">
        {[['bg-green-400', 'Shift'], ['bg-amber-400', 'Payout']].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${c}`} />
            <span className="text-[#666] text-[9px]">{l}</span>
          </div>
        ))}
      </div>

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
