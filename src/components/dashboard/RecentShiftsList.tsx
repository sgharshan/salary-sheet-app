import type { Shift } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDateWithWeekday } from '../../lib/dateHelpers'
import SwipeableRow from '../ui/SwipeableRow'

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
        const row = (
          <div className={`flex justify-between items-center px-4 py-3 ${i < shifts.length - 1 ? 'border-b border-[#1e1e1e]' : ''}`}>
            <div>
              <div className="text-white text-sm">{formatDisplayDateWithWeekday(s.date)}{s.label ? ` · ${s.label}` : ''}</div>
              <div className="text-[#666] text-xs">{s.startTime} – {s.endTime} · {hrs.toFixed(1)}h</div>
            </div>
            <div className="text-green-400 font-semibold text-sm">{symbol}{pay.toFixed(2)}</div>
          </div>
        )

        if (onEditShift && onDeleteShift) {
          return (
            <SwipeableRow key={s.id} onEdit={() => onEditShift(s)} onDelete={() => onDeleteShift(s.id)}>
              {row}
            </SwipeableRow>
          )
        }
        return <div key={s.id}>{row}</div>
      })}
    </div>
  )
}
