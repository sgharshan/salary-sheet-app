import { useId } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

interface Props {
  label: string
  value: string // 'HH:MM'
  onChange: (value: string) => void
}

export default function DialPicker({ label, value, onChange }: Props) {
  const labelId = useId()
  const [hours, minutes] = value.split(':')
  const selectClass = 'min-h-12 min-w-0 flex-1 cursor-pointer rounded-lg border border-white/10 bg-[#111] px-1 py-2 text-center text-xl font-semibold tabular-nums text-white transition-colors hover:border-indigo-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400'

  return (
    <div role="group" aria-labelledby={labelId} className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-[#161616] p-3 text-center">
      <div id={labelId} className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#a1a1aa]">{label}</div>
      <div className="flex items-center justify-center gap-1.5">
        <select aria-label={`${label} hours`} value={hours} onChange={event => onChange(`${event.target.value}:${minutes}`)} className={selectClass}>
          {HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
        </select>
        <span className="text-lg font-medium text-[#888]" aria-hidden="true">:</span>
        <select aria-label={`${label} minutes`} value={minutes} onChange={event => onChange(`${hours}:${event.target.value}`)} className={selectClass}>
          {MINUTES.map(minute => <option key={minute} value={minute}>{minute}</option>)}
        </select>
      </div>
    </div>
  )
}
