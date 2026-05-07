import type { Shift } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDate } from '../../lib/dateHelpers'

interface Props { shifts: Shift[]; symbol: string }

export default function RecentShiftsList({ shifts, symbol }: Props) {
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
            <div>
              <div className="text-white text-sm">{formatDisplayDate(s.date)}{s.label ? ` · ${s.label}` : ''}</div>
              <div className="text-[#666] text-xs">{s.startTime} – {s.endTime} · {hrs.toFixed(1)}h</div>
            </div>
            <div className="text-green-400 font-semibold text-sm">{symbol}{pay.toFixed(2)}</div>
          </div>
        )
      })}
    </div>
  )
}
