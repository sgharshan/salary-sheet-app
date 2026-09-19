import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SwipeableRow from '../components/ui/SwipeableRow'

afterEach(cleanup)

describe('SwipeableRow', () => {
  it('exposes actions through a button and hides them again on Escape', () => {
    const onEdit = vi.fn()
    render(<SwipeableRow onEdit={onEdit} onDelete={() => {}}>Monday shift</SwipeableRow>)
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: /actions/i })
    trigger.focus()
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const edit = screen.getByRole('button', { name: 'Edit' })
    expect(edit).toHaveFocus()
    fireEvent.keyDown(edit, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Monday shift'))
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('requires confirmation before deleting and supports cancelling', () => {
    const onDelete = vi.fn()
    render(<SwipeableRow onEdit={() => {}} onDelete={onDelete}>Monday shift</SwipeableRow>)
    fireEvent.click(screen.getByRole('button', { name: /actions/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /actions/i })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: /actions/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }))
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
