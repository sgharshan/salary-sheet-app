import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import DialPicker from '../components/ui/DialPicker'

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
afterEach(() => {
  cleanup()
  if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

it('shows exact existing minutes and retains them when the hour changes', () => {
  // jsdom has no scrolling layout, so leave only the browser scroll side effect inert.
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: () => {} })
  const onChange = vi.fn()
  render(<DialPicker label="Start" value="08:07" onChange={onChange} />)
  expect(screen.getByRole('combobox', { name: 'Start minutes' })).toHaveValue('07')
  fireEvent.change(screen.getByRole('combobox', { name: 'Start hours' }), { target: { value: '09' } })
  expect(onChange).toHaveBeenCalledWith('09:07')
})
