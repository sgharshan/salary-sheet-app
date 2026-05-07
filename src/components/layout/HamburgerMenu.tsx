import { Link } from 'react-router-dom'

interface Props {
  open: boolean
  onClose: () => void
  onLogPayout: () => void
}

export default function HamburgerMenu({ open, onClose, onLogPayout }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-72 bg-[#111] h-full p-6 flex flex-col gap-2">
        <div className="text-[#555] text-xs tracking-widest mb-6">SHIFTLOG</div>
        {[
          { to: '/', label: 'Home' },
          { to: '/calendar', label: 'Calendar' },
          { to: '/reports', label: 'Reports' },
          { to: '/settings', label: 'Settings' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className="text-white text-base py-3 border-b border-[#1e1e1e]"
          >
            {label}
          </Link>
        ))}
        <button
          onClick={() => { onClose(); onLogPayout() }}
          className="text-white text-base py-3 border-b border-[#1e1e1e] text-left"
        >
          Log Payout
        </button>
      </div>
    </div>
  )
}
