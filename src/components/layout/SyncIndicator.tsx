import type { SyncStatus } from '../../hooks/useSync'

interface Props { status: SyncStatus }

export default function SyncIndicator({ status }: Props) {
  const config: Record<SyncStatus, { color: string; label: string }> = {
    synced:       { color: 'bg-green-400',  label: 'Synced' },
    syncing:      { color: 'bg-amber-400',  label: 'Syncing…' },
    offline:      { color: 'bg-[#555]',     label: 'Offline' },
    error:        { color: 'bg-red-500',    label: 'Sync error' },
    disconnected: { color: 'bg-zinc-500',   label: 'Local only' },
  }
  const { color, label } = config[status]
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/[.08] px-3 py-2" role="status" title={status === 'disconnected' ? 'Records are stored on this device. Connect Google Drive in Settings to sync.' : label}>
      <div className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden="true" />
      <span className="whitespace-nowrap text-xs text-zinc-400">{label}</span>
    </div>
  )
}
