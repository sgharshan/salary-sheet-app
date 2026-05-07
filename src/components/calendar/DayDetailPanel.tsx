import type { Shift, Payout } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDate } from '../../lib/dateHelpers'
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
    <div className="bg-[#161616] border border-[#222] rounded-xl overflow-hidden mt-4">
      <div className="text-[#666] text-[9px] tracking-widest px-4 pt-4 pb-2">{formatDisplayDate(date).toUpperCase()}</div>

      {shifts.length === 0 && payouts.length === 0 && (
        <div className="text-[#444] text-sm text-center py-4 px-4 pb-4">Nothing logged</div>
      )}

      {shifts.map(s => {
        const content = (
          <div className="flex justify-between items-center px-4 py-3">
            <div>
              <div className="text-white text-sm">{s.startTime} – {s.endTime}{s.label ? ` · ${s.label}` : ''}</div>
              <div className="text-[#666] text-xs">{calcHoursWorked(s.startTime, s.endTime).toFixed(1)}h</div>
            </div>
            <div className="text-green-400 font-semibold text-sm">
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
          <div className="flex justify-between items-center px-4 py-3">
            <div className="text-amber-400 text-sm">Payout received{p.notes ? ` · ${p.notes}` : ''}</div>
            <div className="text-amber-400 font-semibold text-sm">{symbol}{p.amount.toFixed(2)}</div>
          </div>
        )
        return onEditPayout && onDeletePayout ? (
          <SwipeableRow key={p.id} onEdit={() => onEditPayout(p)} onDelete={() => onDeletePayout(p.id)}>
            {content}
          </SwipeableRow>
        ) : <div key={p.id}>{content}</div>
      })}

      {shifts.length > 0 && (
        <div className="border-t border-[#222] flex justify-between px-4 py-3">
          <span className="text-[#888] text-xs">Day total</span>
          <span className="text-white font-semibold">{symbol}{dayTotal.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}
