import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CalendarPage from '../pages/CalendarPage'
import ReportsPage from '../pages/ReportsPage'

// These flows concern date selection, independent of persisted records.
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => [] }))
vi.mock('../hooks/useSettings', () => ({ useSettings: () => null }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 16, 12))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('calendar navigation', () => {
  it('shows details from the displayed month after navigating into a new year', () => {
    render(<CalendarPage />)

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next month|›/ }))
    }

    expect(screen.getByText(/1 Jan(?:uary)? 2027/i)).toBeInTheDocument()
    expect(screen.queryByText(/16 Sep(?:tember)? 2026/i)).not.toBeInTheDocument()
  })
})

describe('report date range', () => {
  it('blocks exports until a reversed date range is corrected', () => {
    const { container } = render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: /Custom/ }))
    const dates = container.querySelectorAll('input[type="date"]')

    fireEvent.change(dates[0], { target: { value: '2026-09-30' } })
    fireEvent.change(dates[1], { target: { value: '2026-09-01' } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeDisabled()

    fireEvent.change(dates[1], { target: { value: '2026-09-30' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled()
  })

  it('blocks exports when either date is cleared', () => {
    const { container } = render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: /Custom/ }))
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '' } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled()
  })
})
