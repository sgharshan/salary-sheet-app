import { useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  bgColor?: string
}

const ACTION_WIDTH = 130

export default function SwipeableRow({ children, onEdit, onDelete, bgColor = '#161616' }: Props) {
  const [offset, setOffset] = useState(0)
  const [animating, setAnimating] = useState(false)
  const startXRef = useRef<number | null>(null)
  const baseOffsetRef = useRef(0)

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    setAnimating(false)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null) return
    const delta = e.touches[0].clientX - startXRef.current + baseOffsetRef.current
    setOffset(Math.min(0, Math.max(delta, -ACTION_WIDTH)))
  }

  function onTouchEnd() {
    const snap = offset < -(ACTION_WIDTH / 3) ? -ACTION_WIDTH : 0
    baseOffsetRef.current = snap
    setOffset(snap)
    setAnimating(true)
    startXRef.current = null
  }

  function close() {
    baseOffsetRef.current = 0
    setOffset(0)
    setAnimating(true)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Revealed action buttons */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH }}>
        <button
          onClick={e => { e.stopPropagation(); close(); onEdit() }}
          className="flex-1 bg-indigo-500 text-white text-xs font-bold tracking-wide"
        >
          Edit
        </button>
        <button
          onClick={e => { e.stopPropagation(); close(); onDelete() }}
          className="flex-1 bg-red-500 text-white text-xs font-bold tracking-wide"
        >
          Delete
        </button>
      </div>

      {/* Sliding content */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 200ms ease' : 'none',
          backgroundColor: bgColor,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={offset !== 0 ? close : undefined}
      >
        {children}
      </div>
    </div>
  )
}
