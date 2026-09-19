import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Modal from './Modal'

interface Props {
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  bgColor?: string
}

const ACTION_WIDTH = 144

export default function SwipeableRow({ children, onEdit, onDelete, bgColor = '#161616' }: Props) {
  const [offset, setOffset] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const baseOffsetRef = useRef(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const focusActionsOnOpen = useRef(false)
  const actionsId = useId()
  const expanded = offset < 0

  useEffect(() => {
    if (expanded && focusActionsOnOpen.current) {
      focusActionsOnOpen.current = false
      actionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [expanded])

  function moveTo(nextOffset: number) {
    if (nextOffset === 0 && actionsRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
    setOffset(nextOffset)
  }

  function onTouchStart(event: React.TouchEvent) {
    startRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    setAnimating(false)
  }

  function onTouchMove(event: React.TouchEvent) {
    if (!startRef.current) return
    const deltaX = event.touches[0].clientX - startRef.current.x
    const deltaY = event.touches[0].clientY - startRef.current.y
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      startRef.current = null
      return
    }
    moveTo(Math.min(0, Math.max(deltaX + baseOffsetRef.current, -ACTION_WIDTH)))
  }

  function onTouchEnd() {
    const snap = offset < -(ACTION_WIDTH / 3) ? -ACTION_WIDTH : 0
    baseOffsetRef.current = snap
    moveTo(snap)
    setAnimating(true)
    startRef.current = null
  }

  function close(restoreFocus = false) {
    focusActionsOnOpen.current = false
    baseOffsetRef.current = 0
    moveTo(0)
    setAnimating(true)
    if (restoreFocus) triggerRef.current?.focus()
  }

  return (
    <div className="relative overflow-hidden" onKeyDown={event => {
      if (event.key === 'Escape' && expanded) {
        event.preventDefault()
        close(true)
      }
    }}>
      <div ref={actionsRef} id={actionsId} aria-hidden={!expanded} inert={!expanded} className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH, visibility: expanded ? 'visible' : 'hidden' }}>
        <button
          type="button"
          onClick={() => { close(true); onEdit() }}
          className="flex-1 bg-indigo-500/20 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-indigo-300"
        >Edit</button>
        <button
          type="button"
          onClick={() => { close(true); setConfirmingDelete(true) }}
          className="flex-1 bg-red-500/15 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-red-300"
        >Delete</button>
      </div>

      <div
        className="relative flex items-stretch"
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          backgroundColor: bgColor,
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => close()}
      >
        <div className="min-w-0 flex-1" onClick={expanded ? () => close() : undefined}>{children}</div>
        <button
          ref={triggerRef}
          type="button"
          className="icon-button mr-2 shrink-0 self-center"
          aria-label={expanded ? 'Hide entry actions' : 'Show entry actions'}
          aria-expanded={expanded}
          aria-controls={actionsId}
          onClick={() => {
            if (expanded) { close(true); return }
            focusActionsOnOpen.current = true
            baseOffsetRef.current = -ACTION_WIDTH
            moveTo(-ACTION_WIDTH)
            setAnimating(true)
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
        </button>
      </div>

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)} title="Delete this entry?">
        <p className="mb-6 text-sm leading-relaxed text-[#a1a1aa]">This entry will be removed from your records. This cannot be undone.</p>
        <div className="flex gap-3">
          <button type="button" className="button-secondary flex-1" onClick={() => setConfirmingDelete(false)}>Cancel</button>
          <button type="button" className="min-h-11 flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-400" onClick={() => { setConfirmingDelete(false); onDelete() }}>Confirm delete</button>
        </div>
      </Modal>
    </div>
  )
}
