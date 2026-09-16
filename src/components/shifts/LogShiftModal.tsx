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

const blankDraft = (storeName: string): ShiftDraft => ({ startTime: '08:00', endTime: '16:00', label: '', notes: '', storeName })

export default function LogShiftModal({ open, onClose, editShift }: Props) {
  const settings = useSettings()
  const [date, setDate] = useState(today())
  const [drafts, setDrafts] = useState<ShiftDraft[]>([blankDraft('')])
  const [saving, setSaving] = useState(false)
  const [resolvedRate, setResolvedRate] = useState<{ key: string; value: number } | null>(null)
  const [rateError, setRateError] = useState('')
  const [saveError, setSaveError] = useState('')

  const currentRate = settings?.currentHourlyRate ?? 0
  const symbol = settings?.currencySymbol ?? '£'
  const stores = settings?.stores ?? []
  const defaultStoreName = stores.find(s => s.id === settings?.defaultStoreId)?.name ?? ''
  const settingsLoaded = settings !== null
  const isEditing = !!editShift
  const rateKey = JSON.stringify([date, currentRate, settings?.rateHistory])
  const rate = editShift
    ? editShift.hourlyRateSnapshot
    : resolvedRate?.key === rateKey ? resolvedRate.value : null
  const validTimes = drafts.every(draft =>
    /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime)
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.endTime)
    && draft.startTime !== draft.endTime,
  )

  useEffect(() => {
    setSaveError('')
    setRateError('')
    if (editShift) {
      setDate(editShift.date)
      setDrafts([{
        startTime: editShift.startTime,
        endTime: editShift.endTime,
        label: editShift.label,
        notes: editShift.notes,
        storeName: editShift.storeName,
      }])
    } else {
      setDate(today())
      setDrafts([blankDraft(defaultStoreName)])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editShift, open, settingsLoaded])

  useEffect(() => {
    if (!open || !settingsLoaded || editShift || !date) return
    let cancelled = false
    setResolvedRate(null)
    setRateError('')
    getRateForDate(date).then(snapshotRate => {
      if (!cancelled) setResolvedRate({ key: rateKey, value: snapshotRate || currentRate })
    }).catch(() => {
      if (!cancelled) setRateError('Could not load the hourly rate. Reopen this form to try again.')
    })
    return () => { cancelled = true }
  }, [open, settingsLoaded, editShift, date, rateKey, currentRate])

  function reset() {
    setDate(today())
    setDrafts([blankDraft(defaultStoreName)])
  }

  async function handleSave() {
    if (saving || rate === null || !settingsLoaded || !date || !validTimes) return
    setSaving(true)
    setSaveError('')
    try {
      if (isEditing && editShift) {
        const d = drafts[0]
        await updateShift(editShift.id, {
          date,
          startTime: d.startTime,
          endTime: d.endTime,
          label: d.label,
          notes: d.notes,
          storeName: d.storeName,
          hourlyRateSnapshot: rate,
        })
      } else {
        for (const d of drafts) {
          await addShift({
            date,
            startTime: d.startTime,
            endTime: d.endTime,
            label: d.label,
            notes: d.notes,
            storeName: d.storeName,
            hourlyRateSnapshot: rate,
          })
        }
      }
      reset()
      onClose()
    } catch {
      setSaveError('Your shift could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function updateDraft(i: number, d: ShiftDraft) {
    setDrafts(prev => prev.map((x, idx) => idx === i ? d : x))
  }

  return (
    <Modal open={open} onClose={() => { if (!saving) { reset(); onClose() } }} title={isEditing ? 'Edit Shift' : 'Log Shift'}>
      <p className="mb-5 text-sm leading-relaxed text-slate-400">
        {isEditing ? 'Update the details. The saved hourly rate stays the same.' : 'Add your hours and see your earnings before you save.'}
      </p>
      <fieldset disabled={saving || !settingsLoaded} className="min-w-0">
        <label className="block mb-5">
          <span className="field-label">Date</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="field-input"
          />
        </label>

        {drafts.map((d, i) => (
          <ShiftFormRow
            key={i}
            index={i}
            draft={d}
            rate={rate}
            symbol={symbol}
            stores={stores}
            onChange={updated => updateDraft(i, updated)}
            onRemove={i > 0 ? () => setDrafts(prev => prev.filter((_, idx) => idx !== i)) : undefined}
          />
        ))}

        {!isEditing && (
          <button
            onClick={() => setDrafts(prev => [...prev, blankDraft(defaultStoreName)])}
            type="button"
            className="button-secondary w-full border-dashed mt-2"
          >
            + Add another shift for this day
          </button>
        )}
      </fieldset>
      {!validTimes && <p role="alert" className="mt-4 text-sm text-amber-200">Enter a start and end time for each shift. They must be different.</p>}
      {rateError && <p role="alert" className="mt-4 text-sm text-rose-300">{rateError}</p>}
      {saveError && <p role="alert" className="mt-4 text-sm text-rose-300">{saveError}</p>}
      <div className="mt-5 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || rate === null || !settingsLoaded || !date || !validTimes}
          className="button-primary w-full disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : drafts.length > 1 ? `Save ${drafts.length} shifts` : 'Save shift'}
        </button>
        {rate === null && !rateError && <p role="status" className="mt-2 text-center text-xs text-slate-400">Loading hourly rate…</p>}
      </div>
    </Modal>
  )
}
