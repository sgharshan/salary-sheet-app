import { useEffect, useCallback, useState } from 'react'
import { db } from '../db/database'
import { uploadData, downloadData, initTokenClient, requestAccessToken } from '../lib/googleDrive'
import { updateSettings } from './useSettings'
import type { DriveData } from '../lib/googleDrive'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error'

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'pending' : 'offline')

  const sync = useCallback(async () => {
    if (!navigator.onLine || !CLIENT_ID) { setStatus('offline'); return }
    try {
      setStatus('pending')
      await initTokenClient(CLIENT_ID)
      await requestAccessToken()

      const remote = await downloadData()
      const localShifts = await db.shifts.toArray()
      const localPayouts = await db.payouts.toArray()
      const localSettings = await db.settings.get(1)

      if (remote && remote.lastModified > (localSettings?.lastSyncedAt ?? '')) {
        await db.shifts.bulkPut(remote.shifts)
        await db.payouts.bulkPut(remote.payouts)
      }

      const data: DriveData = {
        shifts: localShifts,
        payouts: localPayouts,
        settings: localSettings ?? {},
        lastModified: new Date().toISOString(),
      }
      await uploadData(data)
      await updateSettings({ lastSyncedAt: data.lastModified })
      setStatus('synced')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => sync()
    const handleOffline = () => setStatus('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sync])

  return { status, sync }
}
