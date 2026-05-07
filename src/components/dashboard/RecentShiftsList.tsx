import type { Shift } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDate } from '../../lib/dateHelpers'

interface Props {
  shifts: Shift[]
  symbol: string
  onEditShift?: (s: Shift) => void
  onDeleteShift?: (id: string) => void
}

export default function RecentShiftsList({ shifts, symbol, onEditShift, onDeleteShift }: Props) {
  if (shifts.length === 0) {
    return <div className="text-[#444] text-sm text-center py-8">No shifts logged yet</div>
  }
  return (
    <div className="bg-[#161616] rounded-xl overflow-hidden border border-[#1e1e1e]">
      {shifts.map((s, i) => {
        const pay = calcShiftPay(s.startTime, s.endTime, s.hourlyRateSnapshot)
        const hrs = calcHoursWorked(s.startTime, s.endTime)
        return (
          <div key={s.id} className={`flex justify-between items-center px-4 py-3 ${i < shifts.length - 1 ? 'border-b border-[#1e1e1e]' : ''}`}>
            <div className="flex-1">
              <div className="text-white text-sm">{formatDisplayDate(s.date)}{s.label ? ` · ${s.label}` : ''}</div>
              <div className="text-[#666] text-xs">{s.startTime} – {s.endTime} · {hrs.toFixed(1)}h</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-green-400 font-semibold text-sm">{symbol}{pay.toFixed(2)}</div>
              {onEditShift && (
                <button onClick={() => onEditShift(s)} className="text-indigo-400 text-xs">Edit</button>
              )}
              {onDeleteShift && (
                <button onClick={() => onDeleteShift(s.id)} className="text-red-500 text-xs">✕</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
