import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettings } from '../hooks/useSettings'
import { calcShiftPay } from '../lib/calculations'
import { calcOutstanding } from '../lib/calculations'
import { weekStart, weekEnd, monthStart, monthEnd, today } from '../lib/dateHelpers'
import { deleteShift } from '../hooks/useShifts'
import SummaryCards from '../components/dashboard/SummaryCards'
import RecentShiftsList from '../components/dashboard/RecentShiftsList'
import LogShiftModal from '../components/shifts/LogShiftModal'
import type { Shift } from '../types'

export default function Dashboard() {
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

  return (
    <div>
      <div className="text-[#444] text-[9px] tracking-widest mb-4 pt-2">OVERVIEW</div>
      <SummaryCards
        weekEarned={weekEarned}
        monthEarned={monthEarned}
        lastPayoutAmount={lastPayout?.amount ?? null}
        lastPayoutDate={lastPayout?.date ?? null}
        outstanding={calcOutstanding(totalEarned, totalPaid)}
        symbol={symbol}
      />
      <div className="text-[#444] text-[9px] tracking-widest mb-3">RECENT SHIFTS</div>
      <RecentShiftsList
        shifts={allShifts.slice(0, 10)}
        symbol={symbol}
        onEditShift={setEditingShift}
        onDeleteShift={deleteShift}
      />

      <LogShiftModal
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        editShift={editingShift}
      />
    </div>
  )
}
