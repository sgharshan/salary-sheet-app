import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111] rounded-t-2xl p-5 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <button onClick={onClose} className="text-[#888] text-sm">✕ Cancel</button>
          <span className="text-white font-semibold text-sm">{title}</span>
          <span className="w-16" />
        </div>
        {children}
      </div>
    </div>
  )
}
