interface Props { status: 'synced' | 'pending' | 'offline' }

export default function SyncIndicator({ status }: Props) {
  const colors = { synced: 'bg-green-400', pending: 'bg-amber-400', offline: 'bg-[#555]' }
  const labels = { synced: 'Synced', pending: 'Syncing…', offline: 'Offline' }
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-[10px] text-[#666]">{labels[status]}</span>
    </div>
  )
}
