import { useState, useEffect, useId, useRef } from 'react'
import Modal from '../ui/Modal'
import { addPayout, updatePayout } from '../../hooks/usePayouts'
import { useSettings } from '../../hooks/useSettings'
import { today } from '../../lib/dateHelpers'
import type { Payout } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  editPayout?: Payout | null
}

export default function LogPayoutModal({ open, onClose, editPayout }: Props) {
  const settings = useSettings()
  const symbol = settings?.currencySymbol ?? '£'
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)
  const formId = useId()
  const isEditing = !!editPayout

  useEffect(() => {
    setDate(editPayout?.date ?? today())
    setAmount(editPayout ? editPayout.amount.toString() : '')
    setNotes(editPayout?.notes ?? '')
    setError(null)
  }, [editPayout, open])

  function handleClose() {
    if (savingRef.current) return
    onClose()
  }

  async function handleSave() {
    if (savingRef.current) return
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }
    if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(amount)) {
      setError('Enter an amount with no more than two decimal places.')
      return
    }
    if (!date) {
      setError('Enter a date for this payout.')
      return
    }
    setError(null)
    savingRef.current = true
    setSaving(true)
    try {
      if (editPayout) {
        await updatePayout(editPayout.id, { date, amount: num, notes })
      } else {
        await addPayout({ date, amount: num, notes })
      }
      onClose()
    } catch {
      setError('This payout could not be saved. Please try again.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit Payout' : 'Log Payout'}
      footer={<>
        {error && <p id={`${formId}-error`} role="alert" className="mb-3 text-sm text-red-300">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={handleClose} disabled={saving} className="button-secondary">Cancel</button>
          <button type="submit" form={formId} disabled={saving} className="button-primary flex-1" aria-describedby={error ? `${formId}-error` : undefined}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Confirm payout'}
          </button>
        </div>
      </>}
    >
      <form id={formId} aria-label="Payout details" noValidate onSubmit={event => { event.preventDefault(); void handleSave() }}>
        <p className="mb-5 text-sm leading-relaxed text-zinc-400">{isEditing ? 'Update the payment recorded in your log.' : 'Record a payment you have received. It will be included in your balance and reports.'}</p>
        <fieldset disabled={saving} className="min-w-0 space-y-5">
          <label className="block">
            <span className="field-label">Date</span>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="field-input" />
          </label>
          <label className="block">
            <span className="field-label">Amount ({symbol})</span>
            <input type="number" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="field-input text-2xl font-semibold tabular-nums" inputMode="decimal" min="0.01" step="0.01" />
          </label>
          <label className="block">
            <span className="field-label">Notes (optional)</span>
            <textarea placeholder="e.g. Weekly pay" value={notes} onChange={e => setNotes(e.target.value)} className="field-input resize-y" rows={3} />
          </label>
        </fieldset>
      </form>
    </Modal>
  )
}
