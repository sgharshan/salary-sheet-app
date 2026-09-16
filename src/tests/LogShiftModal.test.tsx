import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LogShiftModal from '../components/shifts/LogShiftModal'
import { addShift, updateShift } from '../hooks/useShifts'
import { getRateForDate, useSettings } from '../hooks/useSettings'
import type { Settings, Shift } from '../types'

// IndexedDB is an external boundary in these component tests. Keep the real
// form and calculation components so assertions cover the pay the user sees.
vi.mock('../hooks/useSettings', () => ({ useSettings: vi.fn(), getRateForDate: vi.fn() }))
vi.mock('../hooks/useShifts', () => ({ addShift: vi.fn(), updateShift: vi.fn() }))

const settings: Settings = {
  id: 1, currency: 'GBP', currencySymbol: '£', currentHourlyRate: 20,
  rateHistory: [], stores: [], defaultStoreId: null, lastSyncedAt: null,
  googleAccessToken: null, googleTokenExpiry: null,
}
const shift: Shift = {
  id: 'saved-shift', date: '2026-08-25', startTime: '08:00', endTime: '16:00',
  label: 'Morning', notes: 'Existing note', storeName: 'Old store',
  hourlyRateSnapshot: 12, createdAt: '', updatedAt: '',
}

function deferredRate() {
  let resolve!: (rate: number) => void
  const promise = new Promise<number>(done => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useSettings).mockReturnValue(settings)
  vi.mocked(getRateForDate).mockResolvedValue(15)
  vi.mocked(addShift).mockResolvedValue(undefined)
  vi.mocked(updateShift).mockResolvedValue(undefined)
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() })
})

afterEach(cleanup)

describe('shift form pay', () => {
  it('previews the resolved date rate and saves that same rate', async () => {
    const lookup = deferredRate()
    vi.mocked(getRateForDate).mockReturnValue(lookup.promise)
    render(<LogShiftModal open onClose={() => {}} />)

    expect(screen.getByRole('button', { name: /^Save/ })).toBeDisabled()
    await act(async () => { lookup.resolve(15) })
    expect(screen.getByText('£120.00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await waitFor(() => expect(addShift).toHaveBeenCalledWith(expect.objectContaining({ hourlyRateSnapshot: 15 })))
  })

  it.each([{ rate: 12, pay: '£96.00' }, { rate: 0, pay: '£0.00' }])('preserves an edited £$rate shift rate even when its date changes', async ({ rate, pay }) => {
    const { container } = render(<LogShiftModal open onClose={() => {}} editShift={{ ...shift, hourlyRateSnapshot: rate }} />)

    expect(screen.getAllByText(pay).length).toBeGreaterThan(0)
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-09-01' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await waitFor(() => expect(updateShift).toHaveBeenCalledWith('saved-shift', expect.objectContaining({
      date: '2026-09-01', hourlyRateSnapshot: rate, storeName: 'Old store',
    })))
  })

  it('ignores a stale date lookup and prevents saving until the latest rate resolves', async () => {
    const earlier = deferredRate()
    const latest = deferredRate()
    vi.mocked(getRateForDate).mockImplementation(date => date === '2026-07-01' ? latest.promise : earlier.promise)
    const { container } = render(<LogShiftModal open onClose={() => {}} />)
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-07-01' } })

    await act(async () => { earlier.resolve(10) })
    expect(screen.getByRole('button', { name: /^Save/ })).toBeDisabled()
    expect(screen.queryByText('£80.00')).not.toBeInTheDocument()

    await act(async () => { latest.resolve(18) })
    expect(screen.getByText('£144.00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await waitFor(() => expect(addShift).toHaveBeenCalledWith(expect.objectContaining({
      date: '2026-07-01', hourlyRateSnapshot: 18,
    })))
  })

  it('allows notes to be edited without changing saved pay', async () => {
    render(<LogShiftModal open onClose={() => {}} editShift={shift} />)
    fireEvent.change(screen.getByRole('textbox', { name: /Notes/ }), { target: { value: 'Covered the closing shift' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await waitFor(() => expect(updateShift).toHaveBeenCalledWith('saved-shift', expect.objectContaining({
      notes: 'Covered the closing shift', hourlyRateSnapshot: 12,
    })))
  })

  it('prevents saving incomplete or zero-duration times', async () => {
    render(<LogShiftModal open onClose={() => {}} editShift={shift} />)
    fireEvent.click(screen.getByRole('button', { name: 'Type time' }))
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: /^Save/ })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '08:00' } })
    expect(screen.getByRole('button', { name: /^Save/ })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '06:00' } })
    expect(screen.getByRole('button', { name: /^Save/ })).toBeEnabled()
  })

  it('keeps saving disabled and explains when the rate lookup fails', async () => {
    vi.mocked(getRateForDate).mockRejectedValue(new Error('Database unavailable'))
    render(<LogShiftModal open onClose={() => {}} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/hourly rate/)
    expect(screen.getByRole('button', { name: /^Save/ })).toBeDisabled()
  })
})
