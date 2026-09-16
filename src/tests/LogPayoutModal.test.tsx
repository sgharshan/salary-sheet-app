import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LogPayoutModal from '../components/payouts/LogPayoutModal'
import { addPayout, updatePayout } from '../hooks/usePayouts'
import { useSettings } from '../hooks/useSettings'
import type { Payout } from '../types'

vi.mock('../hooks/useSettings', () => ({ useSettings: vi.fn() }))
vi.mock('../hooks/usePayouts', () => ({ addPayout: vi.fn(), updatePayout: vi.fn() }))

const payout: Payout = {
  id: 'payment', date: '2026-09-01', amount: 200, notes: 'Weekly pay', createdAt: '', updatedAt: '',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useSettings).mockReturnValue(null)
  vi.mocked(addPayout).mockResolvedValue(undefined)
  vi.mocked(updatePayout).mockResolvedValue(undefined)
})
afterEach(cleanup)

describe('payout form', () => {
  it('explains an invalid amount instead of silently ignoring Save', () => {
    const { container } = render(<LogPayoutModal open onClose={() => {}} />)
    fireEvent.change(container.querySelector('input[type="number"]')!, { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/amount/i)
    expect(addPayout).not.toHaveBeenCalled()
  })

  it('blocks an empty date without writing a payment', async () => {
    const { container } = render(<LogPayoutModal open onClose={() => {}} />)
    fireEvent.change(container.querySelector('input[type="number"]')!, { target: { value: '200' } })
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/date/i)
    expect(addPayout).not.toHaveBeenCalled()
  })

  it('keeps edited values available after a save error so the user can retry', async () => {
    const onClose = vi.fn()
    vi.mocked(updatePayout).mockRejectedValueOnce(new Error('Storage unavailable'))
    const { container } = render(<LogPayoutModal open onClose={onClose} editPayout={payout} />)
    fireEvent.change(container.querySelector('input[type="number"]')!, { target: { value: '250.50' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(container.querySelector('input[type="number"]')).toHaveValue(250.5)
    expect(container.querySelector('textarea')).toHaveValue('Weekly pay')
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(updatePayout).toHaveBeenLastCalledWith('payment', { date: '2026-09-01', amount: 250.5, notes: 'Weekly pay' })
  })
})
