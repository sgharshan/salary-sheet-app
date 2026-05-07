import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import HamburgerMenu from './HamburgerMenu'
import SyncIndicator from './SyncIndicator'
import LogShiftModal from '../shifts/LogShiftModal'
import LogPayoutModal from '../payouts/LogPayoutModal'

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [shiftOpen, setShiftOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="flex justify-between items-center px-4 py-4 sticky top-0 bg-[#0a0a0a] z-30">
        <button onClick={() => setMenuOpen(true)} className="text-white text-xl">☰</button>
        <span className="text-[#555] text-xs tracking-widest font-semibold">SHIFTLOG</span>
        <SyncIndicator status="offline" />
      </div>

      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogPayout={() => setPayoutOpen(true)}
      />

      {/* Page content */}
      <main className="px-4 pb-32">
        <Outlet />
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShiftOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-500 text-white font-bold px-8 py-4 rounded-full shadow-lg text-sm z-30"
      >
        + Log Shift
      </button>

      <LogShiftModal open={shiftOpen} onClose={() => setShiftOpen(false)} />
      <LogPayoutModal open={payoutOpen} onClose={() => setPayoutOpen(false)} />
    </div>
  )
}
