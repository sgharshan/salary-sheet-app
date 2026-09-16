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
    <div className="page-stack">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Make ShiftLog fit the way you work.</p>
      </header>

      {/* Hourly rate */}
      <section className="surface p-4 sm:p-5" aria-labelledby="hourly-rate-heading">
        <h2 id="hourly-rate-heading" className="section-heading mb-2">Hourly rate</h2>
        <p className="mb-5 text-sm leading-relaxed text-zinc-400">Your rate is saved with each shift, so past earnings keep their original rate.</p>
        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="field-label">Rate per hour ({symbol})</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                className="field-input w-full text-xl font-semibold"
                autoFocus
                inputMode="decimal"
              />
            </label>
            <div className="flex gap-3">
              <button onClick={handleRateSave} className="button-primary">Save rate</button>
              <button onClick={() => setEditing(false)} className="button-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center gap-4">
            <div>
              <p className="text-white text-3xl font-semibold tracking-tight tabular-nums">{symbol}{settings.currentHourlyRate.toFixed(2)}<span className="ml-1 text-zinc-400 text-sm font-normal">/hr</span></p>
              {saved && <p role="status" className="text-[#86d7ac] text-xs mt-2">Rate updated</p>}
            </div>
            <button onClick={() => { setEditing(true); setRateInput(settings.currentHourlyRate.toString()) }} className="button-secondary">Edit rate</button>
          </div>
        )}
      </section>

      {/* Rate history */}
      {settings.rateHistory.length > 0 && (
        <section className="surface p-4 sm:p-5" aria-labelledby="rate-history-heading">
          <h2 id="rate-history-heading" className="section-heading mb-4">Rate history</h2>
          <dl className="divide-y divide-[#292929]">
            {settings.rateHistory.slice().reverse().map((r, i) => (
              <div key={i} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0 text-sm">
                <dt className="text-zinc-400">{formatDisplayDate(r.effectiveFrom)}</dt>
                <dd className="shrink-0 text-zinc-100 tabular-nums">{symbol}{r.rate.toFixed(2)}/hr</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Stores */}
      <section className="surface p-4 sm:p-5" aria-labelledby="stores-heading">
        <h2 id="stores-heading" className="section-heading mb-2">Stores</h2>
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">Keep track of where you work. Your default store is selected for new shifts.</p>
        <label htmlFor="new-store" className="field-label">Store name</label>
        <div className="flex gap-3 mb-4">
          <input
            id="new-store"
            type="text"
            placeholder="e.g. High Street"
            value={storeInput}
            onChange={e => setStoreInput(e.target.value)}
            className="field-input min-w-0 flex-1"
          />
          <button onClick={handleAddStore} className="button-primary shrink-0">Add</button>
        </div>
        {settings.stores.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#333] px-4 py-4 text-sm text-zinc-400">No stores yet. Add your first location above.</p>
        ) : (
          <div className="divide-y divide-[#292929]">{settings.stores.map(store => (
            <div key={store.id} className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 py-3 last:pb-0">
              <span className="min-w-0 break-words text-zinc-100 text-sm font-medium">{store.name}</span>
              <div className="flex items-center gap-2">
                {settings.defaultStoreId === store.id ? (
                  <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-300 text-xs font-medium">Default</span>
                ) : (
                  <button onClick={() => setDefaultStore(store.id)} aria-label={`Set ${store.name} as default`} className="min-h-11 rounded-lg px-2 text-zinc-400 text-xs hover:bg-[#242424] hover:text-white">Set default</button>
                )}
                <button onClick={() => deleteStore(store.id)} aria-label={`Delete ${store.name}`} className="min-h-11 rounded-lg px-2 text-red-300 text-xs hover:bg-red-400/10">Delete</button>
              </div>
            </div>
          ))}</div>
        )}
      </section>

      {/* Currency */}
      <section className="surface p-4 sm:p-5" aria-labelledby="currency-heading">
        <h2 id="currency-heading" className="section-heading mb-2">Currency</h2>
        <p className="mb-4 text-sm text-zinc-400">Choose the currency shown throughout your log.</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ code: 'GBP', sym: '£' }, { code: 'USD', sym: '$' }, { code: 'EUR', sym: '€' }].map(c => (
            <button
              key={c.code}
              onClick={() => updateSettings({ currency: c.code, currencySymbol: c.sym })}
              aria-pressed={settings.currency === c.code}
              className={`min-h-11 px-2 py-3 rounded-xl text-sm font-medium border transition-colors ${settings.currency === c.code ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40' : 'bg-[#202020] text-zinc-400 border-[#292929] hover:bg-[#292929] hover:text-white'}`}
            >
              {c.sym} {c.code}
            </button>
          ))}
        </div>
      </section>

      {/* Google Drive Sync */}
      <section className="surface p-4 sm:p-5" aria-labelledby="sync-heading">
        <h2 id="sync-heading" className="section-heading mb-4">Google Drive sync</h2>
        {connected ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#86d7ac]" aria-hidden="true" />
              <span className="text-[#86d7ac] text-sm font-medium">Connected</span>
            </div>
            {settings.lastSyncedAt && (
              <div className="text-zinc-400 text-sm mb-4">
                Last synced: {formatDisplayDate(settings.lastSyncedAt.slice(0, 10))}
                {' '}at {new Date(settings.lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={sync}
                className="button-primary"
              >
                Sync Now
              </button>
              <button
                onClick={disconnect}
                className="button-secondary"
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Back up your data automatically to Google Drive. Syncs every 5 minutes when online.
            </p>
            {CLIENT_CONFIGURED ? (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="button-primary"
              >
                {connecting ? 'Opening Google…' : 'Connect Google Drive'}
              </button>
            ) : (
              <p className="text-zinc-400 text-sm leading-relaxed bg-[#202020] rounded-xl px-4 py-3">
                Cloud sync is not available in this version. Your entries are saved on this device.
              </p>
            )}
          </>
        )}
      </section>

      <p className="text-zinc-500 text-xs text-center py-2">ShiftLog · Made for your working day</p>
    </div>
  )
}
