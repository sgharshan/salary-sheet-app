import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import AppShell from '../components/layout/AppShell'

// Keep the real navigation and dialogs; isolate unrelated storage and sync effects.
vi.mock('../hooks/useSettings', () => ({ useSettings: () => null, getRateForDate: vi.fn() }))
vi.mock('../hooks/useSync', () => ({
  useSync: () => ({ status: 'disconnected', connected: false, connect: vi.fn(), sync: vi.fn(), disconnect: vi.fn() }),
}))

const originalUrl = window.location.href
afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', originalUrl)
})

it('skips navigation without changing the current hash route', () => {
  window.history.replaceState(null, '', '#/calendar')
  render(<HashRouter><Routes>
    <Route element={<AppShell />}>
      <Route path="/calendar" element={<h1>Calendar entries</h1>} />
    </Route>
  </Routes></HashRouter>)

  const skipLink = screen.getByRole('link', { name: 'Skip to content' })
  skipLink.focus()
  fireEvent.click(skipLink)

  expect(screen.getByRole('main')).toHaveFocus()
  expect(window.location.hash).toBe('#/calendar')
  expect(screen.getByRole('heading', { name: 'Calendar entries' })).toBeInTheDocument()
})
