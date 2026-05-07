import type { Shift, Payout } from '../../types'
import { toISODate } from '../../lib/dateHelpers'

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

  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d, i) => (
          <div key={i} className="text-[#444] text-[9px] text-center py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
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
              className={`relative flex flex-col items-center py-1.5 rounded-lg transition-colors ${isSelected ? 'bg-indigo-500/20' : isToday ? 'bg-[#1e1e1e]' : ''}`}
            >
              <span className={`text-xs mb-0.5 ${isToday ? 'text-indigo-400 font-bold' : 'text-white'}`}>{day}</span>
              <div className="flex gap-0.5">
                {shiftCount >= 1 && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                {shiftCount >= 2 && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                {hasPayout && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
