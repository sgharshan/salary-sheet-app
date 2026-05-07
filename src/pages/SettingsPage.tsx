import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useSettings, updateHourlyRate, updateSettings } from '../hooks/useSettings'
import { formatDisplayDate } from '../lib/dateHelpers'

export default function SettingsPage() {
  const { sync } = useOutletContext<{ sync: () => void }>()
  const settings = useSettings()
  const [rateInput, setRateInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!settings) return null
  const symbol = settings.currencySymbol

  async function handleRateSave() {
    const n = parseFloat(rateInput)
    if (isNaN(n) || n <= 0) return
    await updateHourlyRate(n)
    setEditing(false)
    setRateInput('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="text-[#444] text-[9px] tracking-widest mb-4 pt-2">SETTINGS</div>

      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        <div className="text-[#666] text-[9px] tracking-widest mb-2">HOURLY RATE</div>
        {editing ? (
          <div className="flex gap-3 items-center">
            <span className="text-white text-xl font-bold">{symbol}</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-xl font-bold flex-1 outline-none"
              autoFocus
              inputMode="decimal"
            />
            <button onClick={handleRateSave} className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Save</button>
            <button onClick={() => setEditing(false)} className="text-[#666] text-sm">Cancel</button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white text-2xl font-bold">{symbol}{settings.currentHourlyRate.toFixed(2)}<span className="text-[#666] text-sm font-normal">/hr</span></div>
              {saved && <div className="text-green-400 text-xs mt-1">Rate updated</div>}
            </div>
            <button onClick={() => { setEditing(true); setRateInput(settings.currentHourlyRate.toString()) }} className="text-indigo-400 text-sm">Edit</button>
          </div>
        )}
      </div>

      {settings.rateHistory.length > 0 && (
        <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
          <div className="text-[#666] text-[9px] tracking-widest mb-2">RATE HISTORY</div>
          {settings.rateHistory.slice().reverse().map((r, i) => (
            <div key={i} className="flex justify-between mb-2">
              <span className="text-[#888] text-sm">{formatDisplayDate(r.effectiveFrom)}</span>
              <span className="text-white text-sm">{symbol}{r.rate.toFixed(2)}/hr</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        <div className="text-[#666] text-[9px] tracking-widest mb-2">CURRENCY</div>
        <div className="flex gap-3">
          {[{ code: 'GBP', sym: '£' }, { code: 'USD', sym: '$' }, { code: 'EUR', sym: '€' }].map(c => (
            <button
              key={c.code}
              onClick={() => updateSettings({ currency: c.code, currencySymbol: c.sym })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${settings.currency === c.code ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-[#111] text-[#888] border-[#333]'}`}
            >
              {c.sym} {c.code}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        <div className="text-[#666] text-[9px] tracking-widest mb-2">GOOGLE DRIVE SYNC</div>
        <div className="text-[#888] text-xs mb-3">Connect to automatically back up your data to Google Drive.</div>
        <button onClick={sync} className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white text-sm font-semibold">
          Connect Google Drive
        </button>
        {settings.lastSyncedAt && (
          <div className="text-[#555] text-xs mt-2">Last synced: {formatDisplayDate(settings.lastSyncedAt.slice(0, 10))}</div>
        )}
      </div>

      <div className="text-[#333] text-xs text-center py-4">ShiftLog v1.0.0</div>
    </div>
  )
}
