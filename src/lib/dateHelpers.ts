export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDisplayDate(isoDate: string): string {
  const [y, m, day] = isoDate.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDisplayTime(time: string): string {
  return time
}

export function weekStart(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // adjust to Monday
  date.setDate(date.getDate() + diff)
  return toISODate(date)
}

export function weekEnd(isoDate: string): string {
  const ws = weekStart(isoDate)
  const [y, m, d] = ws.split('-').map(Number)
  const date = new Date(y, m - 1, d) // local midnight, not UTC
  date.setDate(date.getDate() + 6)
  return toISODate(date)
}

export function monthStart(isoDate: string): string {
  return isoDate.slice(0, 8) + '01'
}

export function monthEnd(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${isoDate.slice(0, 8)}${String(last).padStart(2, '0')}`
}

export function prevMonthStart(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return toISODate(d)
}

export function prevMonthEnd(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number)
  const d = new Date(y, m - 1, 0)
  return toISODate(d)
}

export function today(): string {
  return toISODate(new Date())
}
