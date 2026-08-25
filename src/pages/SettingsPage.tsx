import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useSettings, updateHourlyRate, updateSettings, addStore, deleteStore, setDefaultStore } from '../hooks/useSettings'
import { formatDisplayDate } from '../lib/dateHelpers'

interface OutletCtx {
  connect: () => Promise<void>
  sync: () => Promise<void>
  disconnect: () => void
  connected: boolean
}

const CLIENT_CONFIGURED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function SettingsPage() {
  const { connect, sync, disconnect, connected } = useOutletContext<OutletCtx>()
  const settings = useSettings()
  const [rateInput, setRateInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [storeInput, setStoreInput] = useState('')

  async function handleConnect() {
    setConnecting(true)
    try { await connect() } finally { setConnecting(false) }
  }

  async function handleAddStore() {
    const name = storeInput.trim()
    if (!name) return
    await addStore(name)
    setStoreInput('')
  }

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

      {/* Hourly rate */}
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

      {/* Rate history */}
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

      {/* Stores */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        <div className="text-[#666] text-[9px] tracking-widest mb-3">STORES</div>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Store name"
            value={storeInput}
            onChange={e => setStoreInput(e.target.value)}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm outline-none"
          />
          <button onClick={handleAddStore} className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Add</button>
        </div>
        {settings.stores.length === 0 ? (
          <div className="text-[#444] text-xs">No stores added yet</div>
        ) : (
          settings.stores.map(store => (
            <div key={store.id} className="flex justify-between items-center mb-2 last:mb-0">
              <span className="text-white text-sm">{store.name}</span>
              <div className="flex items-center gap-3">
                {settings.defaultStoreId === store.id ? (
                  <span className="text-indigo-400 text-xs font-semibold">Default</span>
                ) : (
                  <button onClick={() => setDefaultStore(store.id)} className="text-[#666] text-xs">Set default</button>
                )}
                <button onClick={() => deleteStore(store.id)} className="text-red-400 text-xs">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Currency */}
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

      {/* Google Drive Sync */}
      <div className="bg-[#161616] border border-[#222] rounded-xl p-4 mb-4">
        <div className="text-[#666] text-[9px] tracking-widest mb-3">GOOGLE DRIVE SYNC</div>
        {connected ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400 text-sm font-semibold">Connected</span>
            </div>
            {settings.lastSyncedAt && (
              <div className="text-[#555] text-xs mb-3">
                Last synced: {formatDisplayDate(settings.lastSyncedAt.slice(0, 10))}
                {' '}at {new Date(settings.lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={sync}
                className="bg-indigo-500 rounded-lg px-4 py-2 text-white text-sm font-semibold"
              >
                Sync Now
              </button>
              <button
                onClick={disconnect}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-[#666] text-sm"
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[#888] text-xs mb-3">
              Back up your data automatically to Google Drive. Syncs every 5 minutes when online.
            </div>
            {CLIENT_CONFIGURED ? (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-indigo-500 rounded-lg px-4 py-2 text-white text-sm font-semibold disabled:opacity-50"
              >
                {connecting ? 'Opening Google…' : 'Connect Google Drive'}
              </button>
            ) : (
              <div className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">
                Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to GitHub Secrets and rebuild.
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-[#333] text-xs text-center py-4">ShiftLog v1.0.0</div>
    </div>
  )
}
