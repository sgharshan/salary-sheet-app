import { useId, useState } from 'react'
import DialPicker from '../ui/DialPicker'
import { calcHoursWorked, calcShiftPay } from '../../lib/calculations'
import type { Store } from '../../types'

const PRESETS = ['08:00–16:00', '09:00–17:00', '18:00–22:00', '22:00–06:00']

export interface ShiftDraft {
  startTime: string
  endTime: string
  label: string
  notes: string
  storeName: string
}

interface Props {
  draft: ShiftDraft
  rate: number | null
  symbol: string
  stores: Store[]
  onChange: (d: ShiftDraft) => void
  onRemove?: () => void
  index: number
}

export default function ShiftFormRow({ draft, rate, symbol, stores, onChange, onRemove, index }: Props) {
  const fieldId = useId()
  const [mode, setMode] = useState<'dial' | 'manual'>('dial')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const hours = calcHoursWorked(draft.startTime, draft.endTime)
  const pay = rate === null ? null : calcShiftPay(draft.startTime, draft.endTime, rate)

  function applyPreset(p: string) {
    const [start, end] = p.split('–')
    onChange({ ...draft, startTime: start, endTime: end })
  }

  return (
    <div className="mb-5 space-y-4">
      {index > 0 && (
        <div className="flex justify-between items-center mb-3">
          <span className="section-heading">Shift {index + 1}</span>
          {onRemove && <button type="button" onClick={onRemove} className="min-h-11 px-3 text-rose-300 text-sm">Remove</button>}
        </div>
      )}

      <label className="block">
        <span className="field-label">Shift label <span className="font-normal text-slate-500">(optional)</span></span>
        <input
          className="field-input"
          placeholder="Morning, evening, night…"
          value={draft.label}
          onChange={e => onChange({ ...draft, label: e.target.value })}
        />
      </label>

      {/* Advanced options: override store for this shift */}
      {(stores.length > 0 || draft.storeName) && (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-1">
          <button
            type="button"
            onClick={() => setAdvancedOpen(o => !o)}
            aria-expanded={advancedOpen}
            aria-controls={`${fieldId}-store`}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm"
          >
            <span className="min-w-0 truncate text-slate-300">{draft.storeName || 'No store selected'}</span>
            <span className="shrink-0 text-indigo-300">{advancedOpen ? 'Done' : 'Change store'}</span>
          </button>
          {advancedOpen && (
            <label id={`${fieldId}-store`} className="block pb-3 pt-2">
              <span className="field-label">Store</span>
              <select
                value={draft.storeName}
                onChange={e => onChange({ ...draft, storeName: e.target.value })}
                className="field-input"
              >
                <option value="">No store</option>
                {draft.storeName && !stores.some(store => store.name === draft.storeName) && (
                  <option value={draft.storeName}>{draft.storeName} (saved)</option>
                )}
                {stores.map(store => (
                  <option key={store.id} value={store.name}>{store.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-xl p-1 border border-white/10 bg-[#161616]" role="group" aria-label="Time entry mode">
        {(['dial', 'manual'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`min-h-11 flex-1 text-sm font-semibold rounded-lg transition-colors ${mode === m ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:text-white'}`}
          >
            {m === 'dial' ? 'Pick time' : 'Type time'}
          </button>
        ))}
      </div>

      {mode === 'dial' ? (
        <div className="flex gap-3">
          <DialPicker label="Start" value={draft.startTime} onChange={v => onChange({ ...draft, startTime: v })} />
          <DialPicker label="End" value={draft.endTime} onChange={v => onChange({ ...draft, endTime: v })} />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {(['startTime', 'endTime'] as const).map(field => (
              <label key={field} className="min-w-0 rounded-xl p-3 border border-white/10 bg-[#161616]">
                <span className="field-label">{field === 'startTime' ? 'Start time' : 'End time'}</span>
                <input
                  type="time"
                  value={draft[field]}
                  onChange={e => onChange({ ...draft, [field]: e.target.value })}
                  className="min-h-11 min-w-0 bg-transparent text-white text-xl font-semibold w-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                />
              </label>
            ))}
          </div>
          <div className="field-label">Quick presets</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className="min-h-11 rounded-lg border border-white/10 px-3 text-xs text-slate-300 transition-colors hover:bg-white/5"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className="field-label">Notes <span className="font-normal text-slate-500">(optional)</span></span>
        <textarea
          value={draft.notes}
          onChange={e => onChange({ ...draft, notes: e.target.value })}
          placeholder="Anything to remember about this shift"
          rows={2}
          className="field-input resize-y"
        />
      </label>

      <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-4 grid grid-cols-3 gap-2" aria-live="polite">
        <div className="text-center">
          <div className="mb-1 text-[11px] text-slate-400">Duration</div>
          <div className="text-white font-semibold tabular-nums">{Number.isFinite(hours) ? `${hours.toFixed(2)}h` : '—'}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-[11px] text-slate-400">Hourly rate</div>
          <div className="text-slate-300 text-sm tabular-nums">{rate === null ? 'Loading…' : `${symbol}${rate.toFixed(2)}`}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-[11px] text-slate-400">Earnings</div>
          <div className="text-emerald-300 font-semibold tabular-nums">{pay === null || !Number.isFinite(pay) ? '—' : `${symbol}${pay.toFixed(2)}`}</div>
        </div>
      </div>
    </div>
  )
}
