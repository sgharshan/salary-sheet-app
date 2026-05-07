import type { SyncStatus } from '../../hooks/useSync'

interface Props { status: SyncStatus }

export default function SyncIndicator({ status }: Props) {
  const config: Record<SyncStatus, { color: string; label: string }> = {
    synced:       { color: 'bg-green-400',  label: 'Synced' },
    syncing:      { color: 'bg-amber-400',  label: 'Syncing…' },
    offline:      { color: 'bg-[#555]',     label: 'Offline' },
    error:        { color: 'bg-red-500',    label: 'Sync error' },
    disconnected: { color: 'bg-[#333]',     label: '' },
  }
  const { color, label } = config[status]
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      {label && <span className="text-[10px] text-[#666]">{label}</span>}
    </div>
  )
}
