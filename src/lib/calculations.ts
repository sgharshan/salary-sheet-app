function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function calcHoursWorked(startTime: string, endTime: string): number {
  let startMins = timeToMinutes(startTime)
  let endMins = timeToMinutes(endTime)
  if (endMins <= startMins) endMins += 24 * 60 // overnight
  return (endMins - startMins) / 60
}

export function calcShiftPay(
  startTime: string,
  endTime: string,
  rate: number,
): number {
  const hours = calcHoursWorked(startTime, endTime)
  return Math.round(hours * rate * 100) / 100
}

export function calcOutstanding(totalEarned: number, totalPayouts: number): number {
  return Math.max(0, Math.round((totalEarned - totalPayouts) * 100) / 100)
}
