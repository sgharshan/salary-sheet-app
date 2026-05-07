import { useEffect, useCallback, useState } from 'react'
import { db } from '../db/database'
import { uploadData, downloadData, initTokenClient, requestAccessToken, hasValidToken } from '../lib/googleDrive'
import { updateSettings } from './useSettings'
import type { DriveData } from '../lib/googleDrive'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const CONNECTED_KEY = 'gdrive_connected'
const SYNC_INTERVAL_MS = 5 * 60 * 1000  // auto-sync every 5 minutes

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'disconnected'

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>('disconnected')
  const [connected, setConnected] = useState(() => localStorage.getItem(CONNECTED_KEY) === '1')

  // Initialise the GIS token client once on mount
  useEffect(() => {
    if (CLIENT_ID) initTokenClient(CLIENT_ID).catch(() => {})
  }, [])

  // Core sync logic — shared by auto-sync and manual sync
  const doSync = useCallback(async (interactive: boolean) => {
    if (!CLIENT_ID) return
    if (!navigator.onLine) { setStatus('offline'); return }

    try {
      setStatus('syncing')
      await initTokenClient(CLIENT_ID)

      // Refresh token only if expired (or interactive first-connect)
      if (interactive || !hasValidToken()) {
        await requestAccessToken(interactive)
      }

      // Merge: pull remote first, then push local
      const remote = await downloadData()
      const localSettings = await db.settings.get(1)

      if (remote && remote.lastModified > (localSettings?.lastSyncedAt ?? '')) {
        await db.shifts.bulkPut(remote.shifts)
        await db.payouts.bulkPut(remote.payouts)
      }

      const data: DriveData = {
        shifts: await db.shifts.toArray(),
        payouts: await db.payouts.toArray(),
        settings: localSettings ?? {},
        lastModified: new Date().toISOString(),
      }
      await uploadData(data)
      await updateSettings({ lastSyncedAt: data.lastModified })

      localStorage.setItem(CONNECTED_KEY, '1')
      setConnected(true)
      setStatus('synced')
    } catch {
      // Silent failure for background syncs; show error only for interactive
      if (interactive) setStatus('error')
      else setStatus(connected ? 'synced' : 'disconnected')
    }
  }, [connected])

  // Public: user taps "Connect" or "Sync Now"
  const connect = useCallback(() => doSync(true), [doSync])
  // Public: background sync (no popup)
  const sync = useCallback(() => doSync(false), [doSync])

  const disconnect = useCallback(() => {
    localStorage.removeItem(CONNECTED_KEY)
    setConnected(false)
    setStatus('disconnected')
  }, [])

  // Auto-sync when device comes back online
  useEffect(() => {
    const handleOnline = () => { if (connected) sync() }
    const handleOffline = () => setStatus('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    if (!navigator.onLine) setStatus('offline')
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connected, sync])

  // Auto-sync every 5 minutes while connected and online
  useEffect(() => {
    if (!connected) return
    const id = setInterval(() => { if (navigator.onLine) sync() }, SYNC_INTERVAL_MS)
    return () => clearInterval(id)
  }, [connected, sync])

  // Initial sync on app open if previously connected
  useEffect(() => {
    if (connected && navigator.onLine) sync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, connected, connect, sync, disconnect }
}
