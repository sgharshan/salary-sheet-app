import type { Shift, Payout } from '../../types'
import { toISODate, formatDisplayDateWithWeekday } from '../../lib/dateHelpers'

interface Props {
  year: number
  month: number
  shifts: Shift[]
  payouts: Payout[]
  selectedDate: string | null
  onSelectDate: (d: string) => void
}

export default function CalendarGrid({ year, month, shifts, payouts, selectedDate, onSelectDate }: Props) {
  const shiftDateCounts = shifts.reduce<Record<string, number>>((acc, s) => {
    acc[s.date] = (acc[s.date] ?? 0) + 1
    return acc
  }, {})
  const payoutDates = new Set(payouts.map(p => p.date))

  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const startOffset = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toISODate(new Date())

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div>
      <div className="grid grid-cols-7 mb-2" aria-hidden="true">
        {DOW.map((d, i) => (
          <div key={i} className="text-zinc-500 text-[11px] font-medium text-center py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const iso = toISODate(new Date(year, month, day))
          const shiftCount = shiftDateCounts[iso] ?? 0
          const hasPayout = payoutDates.has(iso)
          const isToday = iso === todayStr
          const isSelected = iso === selectedDate

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              aria-label={`${formatDisplayDateWithWeekday(iso)}, ${shiftCount} ${shiftCount === 1 ? 'shift' : 'shifts'}${hasPayout ? ', payout received' : ''}`}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors sm:min-h-14 ${isSelected ? 'bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/50' : isToday ? 'bg-[#242424] hover:bg-[#303030]' : 'hover:bg-[#242424]'}`}
            >
              <span className={`text-sm tabular-nums ${isToday ? 'text-indigo-300 font-bold' : 'text-zinc-200'}`}>{day}</span>
              <div className="flex h-1.5 gap-0.5" aria-hidden="true">
                {shiftCount >= 1 && <span className="w-1.5 h-1.5 rounded-full bg-[#86d7ac]" />}
                {shiftCount >= 2 && <span className="w-1.5 h-1.5 rounded-full bg-[#86d7ac]" />}
                {hasPayout && <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
