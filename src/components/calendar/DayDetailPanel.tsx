import type { Shift, Payout } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDate } from '../../lib/dateHelpers'

interface Props {
  date: string
  shifts: Shift[]
  payouts: Payout[]
  symbol: string
  onEditShift?: (s: Shift) => void
  onDeleteShift?: (id: string) => void
}

export default function DayDetailPanel({ date, shifts, payouts, symbol, onEditShift, onDeleteShift }: Props) {
  const dayTotal = shifts.reduce((s, sh) => s + calcShiftPay(sh.startTime, sh.endTime, sh.hourlyRateSnapshot), 0)

  return (
    <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mt-4">
      <div className="text-[#666] text-[9px] tracking-widest mb-3">{formatDisplayDate(date).toUpperCase()}</div>

      {shifts.length === 0 && payouts.length === 0 && (
        <div className="text-[#444] text-sm text-center py-4">Nothing logged</div>
      )}

      {shifts.map(s => (
        <div key={s.id} className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="text-white text-sm">{s.startTime} – {s.endTime}{s.label ? ` · ${s.label}` : ''}</div>
            <div className="text-[#666] text-xs">{calcHoursWorked(s.startTime, s.endTime).toFixed(1)}h</div>
          </div>
          <div className="flex items-center gap-3 ml-2">
            <div className="text-green-400 font-semibold text-sm">
              {symbol}{calcShiftPay(s.startTime, s.endTime, s.hourlyRateSnapshot).toFixed(2)}
            </div>
            {onEditShift && (
              <button onClick={() => onEditShift(s)} className="text-indigo-400 text-xs">Edit</button>
            )}
            {onDeleteShift && (
              <button onClick={() => onDeleteShift(s.id)} className="text-red-500 text-xs">✕</button>
            )}
          </div>
        </div>
      ))}

      {payouts.map(p => (
        <div key={p.id} className="flex justify-between mb-2">
          <div className="text-amber-400 text-sm">Payout received{p.notes ? ` · ${p.notes}` : ''}</div>
          <div className="text-amber-400 font-semibold text-sm">{symbol}{p.amount.toFixed(2)}</div>
        </div>
      ))}

      {shifts.length > 0 && (
        <>
          <div className="border-t border-[#222] my-3" />
          <div className="flex justify-between">
            <span className="text-[#888] text-xs">Day total</span>
            <span className="text-white font-semibold">{symbol}{dayTotal.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  )
}
