import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import ShiftFormRow, { type ShiftDraft } from './ShiftFormRow'
import { addShift, updateShift } from '../../hooks/useShifts'
import { useSettings, getRateForDate } from '../../hooks/useSettings'
import { today } from '../../lib/dateHelpers'
import type { Shift } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  editShift?: Shift | null
}

const blankDraft = (): ShiftDraft => ({ startTime: '08:00', endTime: '16:00', label: '', notes: '' })

export default function LogShiftModal({ open, onClose, editShift }: Props) {
  const settings = useSettings()
  const [date, setDate] = useState(today())
  const [drafts, setDrafts] = useState<ShiftDraft[]>([blankDraft()])
  const [saving, setSaving] = useState(false)

  const rate = settings?.currentHourlyRate ?? 0
  const symbol = settings?.currencySymbol ?? '£'
  const isEditing = !!editShift

  useEffect(() => {
    if (editShift) {
      setDate(editShift.date)
      setDrafts([{
        startTime: editShift.startTime,
        endTime: editShift.endTime,
        label: editShift.label,
        notes: editShift.notes,
      }])
    } else {
      setDate(today())
      setDrafts([blankDraft()])
    }
  }, [editShift, open])

  function reset() {
    setDate(today())
    setDrafts([blankDraft()])
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (isEditing && editShift) {
        const d = drafts[0]
        const snapshotRate = await getRateForDate(date)
        await updateShift(editShift.id, {
          date,
          startTime: d.startTime,
          endTime: d.endTime,
          label: d.label,
          notes: d.notes,
          hourlyRateSnapshot: snapshotRate || rate,
        })
      } else {
        const snapshotRate = await getRateForDate(date)
        for (const d of drafts) {
          await addShift({
            date,
            startTime: d.startTime,
            endTime: d.endTime,
            label: d.label,
            notes: d.notes,
            hourlyRateSnapshot: snapshotRate || rate,
          })
        }
      }
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function updateDraft(i: number, d: ShiftDraft) {
    setDrafts(prev => prev.map((x, idx) => idx === i ? d : x))
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title={isEditing ? 'Edit Shift' : 'Log Shift'}>
      <div className="flex justify-end -mt-10 mb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-indigo-400 font-semibold text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Date */}
      <div className="bg-[#161616] border border-[#222] rounded-xl px-4 py-3 flex justify-between items-center mb-4">
        <span className="text-[#666] text-sm">Date</span>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-transparent text-white text-sm outline-none"
        />
      </div>

      {drafts.map((d, i) => (
        <ShiftFormRow
          key={i}
          index={i}
          draft={d}
          rate={rate}
          symbol={symbol}
          onChange={updated => updateDraft(i, updated)}
          onRemove={i > 0 ? () => setDrafts(prev => prev.filter((_, idx) => idx !== i)) : undefined}
        />
      ))}

      {!isEditing && (
        <button
          onClick={() => setDrafts(prev => [...prev, blankDraft()])}
          className="w-full border border-dashed border-[#333] rounded-xl py-3 text-[#666] text-sm mt-2"
        >
          + Add another shift for this day
        </button>
      )}
    </Modal>
  )
}
