interface CardProps { label: string; value: string; sub: string; highlight?: boolean }

function Card({ label, value, sub, highlight }: CardProps) {
  return (
    <div className={`bg-[#161616] rounded-xl p-3 border ${highlight ? 'border-red-500/50' : 'border-[#222]'}`}>
      <div className="text-[#666] text-[9px] tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</div>
      <div className="text-[#666] text-[9px] mt-0.5">{sub}</div>
    </div>
  )
}

interface Props {
  weekEarned: number
  monthEarned: number
  lastPayoutAmount: number | null
  lastPayoutDate: string | null
  outstanding: number
  symbol: string
}

export default function SummaryCards({ weekEarned, monthEarned, lastPayoutAmount, lastPayoutDate, outstanding, symbol }: Props) {
  const fmt = (n: number) => `${symbol}${n.toFixed(2)}`
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <Card label="THIS WEEK" value={fmt(weekEarned)} sub="earned" />
      <Card label="THIS MONTH" value={fmt(monthEarned)} sub="earned" />
      <Card label="LAST PAYOUT" value={lastPayoutAmount !== null ? fmt(lastPayoutAmount) : '—'} sub={lastPayoutDate ?? ''} />
      <Card label="OUTSTANDING" value={fmt(outstanding)} sub="unpaid" highlight />
    </div>
  )
}
