import Icon, { type IconName } from '../ui/Icon'
import { formatDisplayDateWithWeekday } from '../../lib/dateHelpers'

interface CardProps { label: string; value: string; sub: string; icon: IconName; highlight?: boolean }

function Card({ label, value, sub, icon, highlight }: CardProps) {
  return (
    <div className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${highlight ? 'border-indigo-400/30 bg-[#1b1b2b]' : 'border-[#292929] bg-[#161616]'}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400 sm:text-sm">{label}</span>
        <span className={highlight ? 'text-indigo-300' : 'text-zinc-500'}><Icon name={icon} width="18" height="18" /></span>
      </div>
      <div className={`break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${highlight ? 'text-indigo-200' : 'text-zinc-100'}`}>{value}</div>
      <div className="mt-2 text-xs leading-relaxed text-zinc-400">{sub}</div>
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
  const fmt = (n: number) => `${symbol}${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Card label="This week" value={fmt(weekEarned)} sub="Earned from Monday to Sunday" icon="clock" />
      <Card label="This month" value={fmt(monthEarned)} sub="Earnings this calendar month" icon="calendar" />
      <Card label="Last payout" value={lastPayoutAmount !== null ? fmt(lastPayoutAmount) : '—'} sub={lastPayoutDate ? formatDisplayDateWithWeekday(lastPayoutDate) : 'No payouts recorded yet'} icon="wallet" />
      <Card label="Outstanding" value={fmt(outstanding)} sub={outstanding > 0 ? 'All-time earnings still to be paid' : 'No outstanding balance'} icon={outstanding > 0 ? 'reports' : 'check'} highlight />
    </div>
  )
}
