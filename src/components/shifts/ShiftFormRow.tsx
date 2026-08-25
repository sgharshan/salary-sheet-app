import { useState } from 'react'
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
  rate: number
  symbol: string
  stores: Store[]
  onChange: (d: ShiftDraft) => void
  onRemove?: () => void
  index: number
}

export default function ShiftFormRow({ draft, rate, symbol, stores, onChange, onRemove, index }: Props) {
  const [mode, setMode] = useState<'dial' | 'manual'>('dial')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const hours = calcHoursWorked(draft.startTime, draft.endTime)
  const pay = calcShiftPay(draft.startTime, draft.endTime, rate)

  function applyPreset(p: string) {
    const [start, end] = p.split('–')
    onChange({ ...draft, startTime: start, endTime: end })
  }

  return (
    <div className="mb-4">
      {index > 0 && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#666] text-xs">Shift {index + 1}</span>
          {onRemove && <button onClick={onRemove} className="text-red-400 text-xs">Remove</button>}
        </div>
      )}

      {/* Label */}
      <input
        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white text-sm mb-3 placeholder-[#444] outline-none"
        placeholder="Label (optional): Morning, Evening, Night…"
        value={draft.label}
        onChange={e => onChange({ ...draft, label: e.target.value })}
      />

      {/* Advanced options: override store for this shift */}
      {stores.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setAdvancedOpen(o => !o)}
            className="text-[#666] text-xs mb-2"
          >
            {advancedOpen ? '▾' : '▸'} Advanced options
          </button>
          {advancedOpen && (
            <select
              value={draft.storeName}
              onChange={e => onChange({ ...draft, storeName: e.target.value })}
              className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white text-sm outline-none"
            >
              <option value="">No store</option>
              {stores.map(store => (
                <option key={store.id} value={store.name}>{store.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex bg-[#161616] rounded-lg p-1 mb-4 border border-[#222]">
        {(['dial', 'manual'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-semibold rounded-md capitalize transition-colors ${mode === m ? 'bg-indigo-500 text-white' : 'text-[#666]'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'dial' ? (
        <div className="flex gap-3 mb-4">
          <DialPicker label="START" value={draft.startTime} onChange={v => onChange({ ...draft, startTime: v })} />
          <DialPicker label="END" value={draft.endTime} onChange={v => onChange({ ...draft, endTime: v })} />
        </div>
      ) : (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {(['startTime', 'endTime'] as const).map(field => (
              <div key={field} className="bg-[#161616] border border-[#222] rounded-xl p-4">
                <div className="text-[#666] text-[9px] tracking-widest mb-1">
                  {field === 'startTime' ? 'START' : 'END'}
                </div>
                <input
                  type="time"
                  value={draft[field]}
                  onChange={e => onChange({ ...draft, [field]: e.target.value })}
                  className="bg-transparent text-white text-2xl font-bold w-full outline-none"
                />
              </div>
            ))}
          </div>
          <div className="text-[#444] text-[9px] tracking-widest mb-2">QUICK PRESETS</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className="bg-[#1a1a1a] border border-[#333] rounded-full px-3 py-1.5 text-[#888] text-[10px]"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live calculation bar */}
      <div className="bg-[#161616] border border-[#222] rounded-xl px-4 py-3 flex justify-between items-center">
        <div className="text-center">
          <div className="text-[#666] text-[9px] tracking-widest">DURATION</div>
          <div className="text-white font-bold">{hours.toFixed(1)}h</div>
        </div>
        <div className="text-center">
          <div className="text-[#666] text-[9px] tracking-widest">RATE</div>
          <div className="text-[#888] text-sm">{symbol}{rate.toFixed(2)}/hr</div>
        </div>
        <div className="text-center">
          <div className="text-[#666] text-[9px] tracking-widest">EARNED</div>
          <div className="text-green-400 font-bold">{symbol}{pay.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
