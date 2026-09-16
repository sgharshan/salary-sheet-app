import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import HamburgerMenu from './HamburgerMenu'
import SyncIndicator from './SyncIndicator'
import LogShiftModal from '../shifts/LogShiftModal'
import LogPayoutModal from '../payouts/LogPayoutModal'
import Icon from '../ui/Icon'
import { useSync } from '../../hooks/useSync'
import { navigation } from './navigation'

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [shiftOpen, setShiftOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const { status, connected, connect, sync, disconnect } = useSync()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-indigo-500 focus:p-3">Skip to content</a>
      <header className="app-header sticky top-0 z-30 border-b border-white/[.07]">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(true)} className="icon-button lg:hidden" aria-label="Open navigation" aria-expanded={menuOpen}><Icon name="menu" /></button>
            <Link to="/" className="flex items-center gap-2.5" aria-label="ShiftLog overview">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-300"><Icon name="clock" /></span>
              <span className="text-lg font-semibold tracking-tight">ShiftLog<span className="text-indigo-400">.</span></span>
            </Link>
          </div>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link"><Icon name={item.icon} />{item.label}</NavLink>)}
          </nav>
          <SyncIndicator status={status} />
        </div>
      </header>
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogPayout={() => setPayoutOpen(true)} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-36 pt-7 sm:px-8 sm:pt-10">
        <Outlet context={{ openLogShift: () => setShiftOpen(true), openLogPayout: () => setPayoutOpen(true), sync, connect, disconnect, connected }} />
      </main>
      <div className="action-dock pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent px-4 pt-8">
        <div className="pointer-events-auto flex w-full max-w-sm gap-2 rounded-2xl border border-[#303030] bg-[#171717] p-2 shadow-xl">
          <button onClick={() => setShiftOpen(true)} className="button-primary flex-1"><Icon name="plus" />Log Shift</button>
          <button onClick={() => setPayoutOpen(true)} className="button-secondary"><Icon name="wallet" />Log Payout</button>
        </div>
      </div>
      <LogShiftModal open={shiftOpen} onClose={() => setShiftOpen(false)} />
      <LogPayoutModal open={payoutOpen} onClose={() => setPayoutOpen(false)} />
    </div>
  )
}
