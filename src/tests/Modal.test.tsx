import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Modal from '../components/ui/Modal'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('Modal', () => {
  it('names the dialog, keeps keyboard focus inside, and returns focus after Escape', () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return <>
        <button onClick={() => setOpen(true)}>Log a shift</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Log Shift">
          <input aria-label="Shift date" />
          <button>Save shift</button>
        </Modal>
      </>
    }
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Log a shift' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Log Shift' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    const first = screen.getByRole('button', { name: /close/i })
    const last = screen.getByRole('button', { name: 'Save shift' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()

    fireEvent.keyDown(last, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps page scrolling locked while another modal remains open', () => {
    document.body.style.overflow = 'auto'
    const { rerender } = render(<>
      <Modal open onClose={() => {}} title="Shift"><button>Save</button></Modal>
      <Modal open={false} onClose={() => {}} title="Payout"><button>Save payout</button></Modal>
    </>)
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<>
      <Modal open onClose={() => {}} title="Shift"><button>Save</button></Modal>
      <Modal open onClose={() => {}} title="Payout"><button>Save payout</button></Modal>
    </>)
    rerender(<>
      <Modal open onClose={() => {}} title="Shift"><button>Save</button></Modal>
      <Modal open={false} onClose={() => {}} title="Payout"><button>Save payout</button></Modal>
    </>)
    expect(document.body.style.overflow).toBe('hidden')
    cleanup()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('keeps focus and scroll locking correct when navigation opens a different dialog', () => {
    function Example() {
      const [active, setActive] = useState<'menu' | 'payout' | null>(null)
      return <>
        <button onClick={() => setActive('menu')}>Open menu</button>
        <Modal open={active === 'menu'} onClose={() => setActive(null)} title="Navigation">
          <button onClick={() => setActive('payout')}>Log payout</button>
        </Modal>
        <Modal open={active === 'payout'} onClose={() => setActive(null)} title="Payout">
          <input aria-label="Amount" />
        </Modal>
      </>
    }
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Open menu' })
    trigger.focus()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Log payout' }))
    const payout = screen.getByRole('dialog', { name: 'Payout' })
    expect(payout).toContainElement(document.activeElement as HTMLElement)
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
})
