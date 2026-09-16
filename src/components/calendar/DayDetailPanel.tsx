import type { Shift, Payout } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDateWithWeekday } from '../../lib/dateHelpers'
import SwipeableRow from '../ui/SwipeableRow'

interface Props {
  date: string
  shifts: Shift[]
  payouts: Payout[]
  symbol: string
  onEditShift?: (s: Shift) => void
  onDeleteShift?: (id: string) => void
  onEditPayout?: (p: Payout) => void
  onDeletePayout?: (id: string) => void
}

export default function DayDetailPanel({ date, shifts, payouts, symbol, onEditShift, onDeleteShift, onEditPayout, onDeletePayout }: Props) {
  const dayTotal = shifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)

  return (
    <section className="surface overflow-hidden" aria-labelledby="selected-day-heading">
      <div className="flex items-center justify-between gap-3 border-b border-[#292929] px-4 py-4 sm:px-5">
        <h2 id="selected-day-heading" className="text-sm font-semibold text-zinc-100">{formatDisplayDateWithWeekday(date)}</h2>
        <span className="shrink-0 text-xs text-zinc-500">{shifts.length + payouts.length} entries</span>
      </div>

      {shifts.length === 0 && payouts.length === 0 && (
        <div className="empty-state">
          <p className="font-medium text-zinc-200">A clear day</p>
          <p className="mt-2 text-sm text-zinc-400">No shifts or payouts logged for this date.</p>
        </div>
      )}

      {shifts.map(s => {
        const content = (
          <div className="flex justify-between items-start gap-3 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-zinc-100 text-sm font-medium">{s.startTime} – {s.endTime}</p>
              <p className="mt-1 text-zinc-400 text-xs">{calcHoursWorked(s.startTime, s.endTime).toFixed(1)} hours</p>
              {(s.label || s.storeName) && <p className="mt-1 break-words text-xs text-zinc-400">{[s.label, s.storeName].filter(Boolean).join(' · ')}</p>}
            </div>
            <div className="shrink-0 text-[#86d7ac] font-semibold text-sm tabular-nums">
              {symbol}{calcShiftPay(s.startTime, s.endTime, s.hourlyRateSnapshot).toFixed(2)}
            </div>
          </div>
        )
        return onEditShift && onDeleteShift ? (
          <SwipeableRow key={s.id} onEdit={() => onEditShift(s)} onDelete={() => onDeleteShift(s.id)}>
            {content}
          </SwipeableRow>
        ) : <div key={s.id}>{content}</div>
      })}

      {payouts.map(p => {
        const content = (
          <div className="flex justify-between items-start gap-3 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-amber-300 text-sm font-medium">Payout received</p>
              {p.notes && <p className="mt-1 break-words text-xs text-zinc-400">{p.notes}</p>}
            </div>
            <div className="shrink-0 text-amber-300 font-semibold text-sm tabular-nums">{symbol}{p.amount.toFixed(2)}</div>
          </div>
        )
        return onEditPayout && onDeletePayout ? (
          <SwipeableRow key={p.id} onEdit={() => onEditPayout(p)} onDelete={() => onDeletePayout(p.id)}>
            {content}
          </SwipeableRow>
        ) : <div key={p.id}>{content}</div>
      })}

      {shifts.length > 0 && (
        <div className="border-t border-[#292929] flex justify-between px-4 py-4 sm:px-5">
          <span className="text-zinc-400 text-sm">Day total</span>
          <span className="text-white font-semibold tabular-nums">{symbol}{dayTotal.toFixed(2)}</span>
        </div>
      )}
    </section>
  )
}
