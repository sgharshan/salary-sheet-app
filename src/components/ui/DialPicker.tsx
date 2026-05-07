import { useRef, useEffect, forwardRef } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']
const ITEM_HEIGHT = 40

interface DrumProps {
  items: string[]
  selectedIndex: number
  onScroll: () => void
}

const Drum = forwardRef<HTMLDivElement, DrumProps>(({ items, onScroll }, ref) => (
  <div
    ref={ref}
    // @ts-ignore — onScrollEnd is a newer browser API not yet in React types
    onScrollEnd={onScroll}
    className="h-[120px] w-12 overflow-y-scroll snap-y snap-mandatory scrollbar-none relative"
    style={{ scrollSnapType: 'y mandatory' }}
  >
    <div className="h-[40px]" />
    {items.map(item => (
      <div
        key={item}
        className="h-[40px] flex items-center justify-center text-white font-semibold text-base snap-center"
      >
        {item}
      </div>
    ))}
    <div className="h-[40px]" />
    <div className="pointer-events-none absolute top-[40px] left-0 right-0 h-[40px] border-t border-b border-indigo-500 bg-indigo-500/10" />
    <div className="pointer-events-none absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-[#161616] to-transparent" />
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[40px] bg-gradient-to-t from-[#161616] to-transparent" />
  </div>
))
Drum.displayName = 'Drum'

interface Props {
  label: string
  value: string   // 'HH:MM'
  onChange: (v: string) => void
}

export default function DialPicker({ label, value, onChange }: Props) {
  const [hh, mm] = value.split(':')
  const hourRef = useRef<HTMLDivElement>(null)
  const minRef = useRef<HTMLDivElement>(null)

  function scrollTo(ref: React.RefObject<HTMLDivElement>, index: number) {
    ref.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
  }

  useEffect(() => {
    scrollTo(hourRef, HOURS.indexOf(hh))
    const minIdx = MINUTES.indexOf(mm)
    scrollTo(minRef, minIdx === -1 ? 0 : minIdx)
  }, [value])

  function handleHourScroll() {
    const el = hourRef.current
    if (!el) return
    const idx = Math.min(Math.round(el.scrollTop / ITEM_HEIGHT), HOURS.length - 1)
    onChange(`${HOURS[idx]}:${mm}`)
  }

  function handleMinScroll() {
    const el = minRef.current
    if (!el) return
    const idx = Math.min(Math.round(el.scrollTop / ITEM_HEIGHT), MINUTES.length - 1)
    onChange(`${hh}:${MINUTES[idx]}`)
  }

  return (
    <div className="flex-1 bg-[#161616] rounded-xl p-3 border border-[#222] text-center">
      <div className="text-[#666] text-[9px] tracking-widest mb-2">{label}</div>
      <div className="flex justify-center gap-1 items-center">
        <Drum ref={hourRef} items={HOURS} selectedIndex={HOURS.indexOf(hh)} onScroll={handleHourScroll} />
        <span className="text-white font-bold text-lg">:</span>
        <Drum ref={minRef} items={MINUTES} selectedIndex={MINUTES.indexOf(mm)} onScroll={handleMinScroll} />
      </div>
    </div>
  )
}
