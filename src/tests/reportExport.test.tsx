import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ReportsPage from '../pages/ReportsPage'
import type { Payout, Shift } from '../types'

const fixtures = vi.hoisted(() => ({
  generatePdf: vi.fn(),
  shifts: [{
    id: 'shift-1', date: '2026-09-16', startTime: '08:00', endTime: '16:00',
    hourlyRateSnapshot: 12.5, storeName: 'High Street', label: 'Morning', notes: '',
    createdAt: '2026-09-16T16:00:00Z', updatedAt: '2026-09-16T16:00:00Z',
  }] satisfies Shift[],
  payouts: [{
    id: 'payout-1', date: '2026-09-16', amount: 50, notes: 'Part payment',
    createdAt: '2026-09-16T17:00:00Z', updatedAt: '2026-09-16T17:00:00Z',
  }] satisfies Payout[],
}))

// Keep the page's query and export handling real, replacing browser storage/downloads.
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: (query: () => unknown) => query() }))
vi.mock('../db/database', () => {
  function table(records: (Shift | Payout)[]) {
    return { where: () => ({ between: (from: string, to: string) => ({
      toArray: () => records.filter(record => record.date >= from && record.date <= to),
    }) }) }
  }
  return { db: { shifts: table(fixtures.shifts), payouts: table(fixtures.payouts) } }
})
vi.mock('../hooks/useSettings', () => ({ useSettings: () => ({
  id: 1, currency: 'GBP', currencySymbol: '£', currentHourlyRate: 15,
  rateHistory: [{ rate: 12.5, effectiveFrom: '2026-09-01' }, { rate: 15, effectiveFrom: '2026-09-19' }],
  stores: [{ id: 'store-1', name: 'High Street' }], defaultStoreId: 'store-1',
  lastSyncedAt: null, googleAccessToken: null, googleTokenExpiry: null,
}) }))
vi.mock('../lib/pdfReport', () => ({ generatePdf: fixtures.generatePdf }))

beforeEach(() => {
  fixtures.generatePdf.mockReset()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 19, 12))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PDF report export', () => {
  it('shows progress and prevents another export while preparing the PDF', async () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    expect(screen.getByRole('button', { name: /Preparing PDF/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeDisabled()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled())
    expect(fixtures.generatePdf).toHaveBeenCalledTimes(1)
  })

  it('preserves the selected dates, stored shift rate and store in the export', async () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-16' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(() => expect(fixtures.generatePdf).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'shift-1', hourlyRateSnapshot: 12.5, storeName: 'High Street' })],
      [expect.objectContaining({ id: 'payout-1', amount: 50 })],
      '2026-09-16', '2026-09-16', '£', 'GBP', 15,
    ))
  })

  it('explains an export failure and allows a successful retry', async () => {
    fixtures.generatePdf.mockImplementationOnce(() => { throw new Error('Download failed') })
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/PDF.*try again/i)
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(() => expect(fixtures.generatePdf).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled()
  })
})
