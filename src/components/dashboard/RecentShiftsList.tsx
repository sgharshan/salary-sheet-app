import type { Shift } from '../../types'
import { calcShiftPay, calcHoursWorked } from '../../lib/calculations'
import { formatDisplayDateWithWeekday } from '../../lib/dateHelpers'
import SwipeableRow from '../ui/SwipeableRow'
import Icon from '../ui/Icon'

interface Props {
  shifts: Shift[]
  symbol: string
  onEditShift?: (s: Shift) => void
  onDeleteShift?: (id: string) => void
  onLogShift?: () => void
}

export default function RecentShiftsList({ shifts, symbol, onEditShift, onDeleteShift, onLogShift }: Props) {
  if (shifts.length === 0) {
    return <div className="surface empty-state">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-300"><Icon name="clock" width="24" height="24" /></span>
      <h3 className="text-base font-medium text-zinc-200">Your first shift starts here</h3>
      <p className="max-w-xs">Log your hours and workplace. Your earnings and outstanding pay will appear here.</p>
      {onLogShift && <button onClick={onLogShift} className="button-secondary mt-2"><Icon name="plus" />Log your first shift</button>}
    </div>
  }
  return (
    <div className="surface overflow-hidden">
      {shifts.map((s, i) => {
        const pay = calcShiftPay(s.startTime, s.endTime, s.hourlyRateSnapshot)
        const hrs = calcHoursWorked(s.startTime, s.endTime)
        const row = (
          <div className={`flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-5 ${i < shifts.length - 1 ? 'border-b border-[#292929]' : ''}`}>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-200">{formatDisplayDateWithWeekday(s.date)}</div>
              {(s.label || s.storeName) && <div className="mt-1 break-words text-xs leading-relaxed text-zinc-400">{[s.label, s.storeName].filter(Boolean).join(' · ')}</div>}
              <div className="mt-1.5 text-xs text-zinc-400 tabular-nums">{s.startTime} – {s.endTime}<span className="mx-2 text-zinc-600">/</span>{hrs.toFixed(1)} hrs</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold text-[#86d7ac] tabular-nums">{symbol}{pay.toFixed(2)}</div>
              <div className="mt-1 text-xs text-zinc-500">earned</div>
            </div>
          </div>
        )
        if (onEditShift && onDeleteShift) {
          return <SwipeableRow key={s.id} onEdit={() => onEditShift(s)} onDelete={() => onDeleteShift(s.id)}>{row}</SwipeableRow>
        }
        return <div key={s.id}>{row}</div>
      })}
    </div>
  )
}
