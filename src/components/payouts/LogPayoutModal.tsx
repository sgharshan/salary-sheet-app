import { useState, useEffect } from 'react'
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

  const isEditing = !!editPayout

  useEffect(() => {
    if (editPayout) {
      setDate(editPayout.date)
      setAmount(editPayout.amount.toString())
      setNotes(editPayout.notes)
    } else {
      setDate(today())
      setAmount('')
      setNotes('')
    }
  }, [editPayout, open])

  function reset() { setDate(today()); setAmount(''); setNotes('') }

  async function handleSave() {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    setSaving(true)
    try {
      if (isEditing && editPayout) {
        await updatePayout(editPayout.id, { date, amount: num, notes })
      } else {
        await addPayout({ date, amount: num, notes })
      }
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title={isEditing ? 'Edit Payout' : 'Log Payout'}>
      <div className="flex justify-end -mt-10 mb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-indigo-400 font-semibold text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="bg-[#161616] border border-[#222] rounded-xl px-4 py-3 flex justify-between items-center mb-4">
        <span className="text-[#666] text-sm">Date</span>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-transparent text-white text-sm outline-none"
        />
      </div>

      <div className="bg-[#161616] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
        <span className="text-white font-bold text-xl">{symbol}</span>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="bg-transparent text-white text-2xl font-bold flex-1 outline-none"
          inputMode="decimal"
          min="0"
          step="0.01"
        />
      </div>

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white text-sm resize-none outline-none placeholder-[#444]"
        rows={3}
      />
    </Modal>
  )
}
